"use client";

import { useState, useEffect } from "react";
import { X, Save, Search, Users, AlertCircle, UserPlus, UserMinus, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  status: string;
  class: {
    id: number;
    name: string;
  };
}

interface AssignedStudent {
  id: number;
  student: Student;
  assignedAt: string;
  status: string;
}

interface Class {
  id: number;
  name: string;
}

interface StudentAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  electiveSubject: {
    id: number;
    subject: {
      id: number;
      name: string;
    };
    maxStudents?: number;
    _count: {
      studentAssignments: number;
    };
  };
  electiveGroup: {
    id: number;
    name: string;
    branch: {
      id: number;
      shortName: string;
    };
  };
  onSuccess: () => void;
}

const StudentAssignmentModal = ({
  isOpen,
  onClose,
  electiveSubject,
  electiveGroup,
  onSuccess
}: StudentAssignmentModalProps) => {
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, electiveSubject.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch classes first
      const classesRes = await fetch(`/api/classes?branchId=${electiveGroup.branch.id}`);
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData.data || classesData || []);
      }

      // Fetch available students and assigned students
      const [availableRes, assignedRes] = await Promise.all([
        fetch(`/api/admin/electives/available-students?branchId=${electiveGroup.branch.id}&electiveSubjectId=${electiveSubject.id}`),
        fetch(`/api/admin/electives/${electiveGroup.id}/subjects/${electiveSubject.id}/students`)
      ]);

      if (availableRes.ok) {
        const data = await availableRes.json();
        setAvailableStudents(data.data || []);
      }

      if (assignedRes.ok) {
        const data = await assignedRes.json();
        setAssignedStudents(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleClassToggle = (classId: number) => {
    const newSelected = new Set(selectedClasses);
    if (newSelected.has(classId)) {
      newSelected.delete(classId);
    } else {
      newSelected.add(classId);
    }
    setSelectedClasses(newSelected);
  };

  const handleAssignStudents = async () => {
    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    // Check max students limit
    if (electiveSubject.maxStudents) {
      const totalAfterAssignment = assignedStudents.length + selectedStudents.size;
      if (totalAfterAssignment > electiveSubject.maxStudents) {
        toast.error(`Cannot assign ${selectedStudents.size} students. Maximum capacity is ${electiveSubject.maxStudents} (currently ${assignedStudents.length} assigned)`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/admin/electives/${electiveGroup.id}/subjects/${electiveSubject.id}/students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentIds: Array.from(selectedStudents)
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Students assigned successfully!");
        setSelectedStudents(new Set());
        onSuccess();
        fetchData(); // Refresh the data
      } else {
        toast.error(data.error || "Failed to assign students");
      }
    } catch (error) {
      console.error("Error assigning students:", error);
      toast.error("Error assigning students");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to remove this student from the elective?")) return;

    try {
      const response = await fetch(
        `/api/admin/electives/${electiveGroup.id}/subjects/${electiveSubject.id}/students?studentId=${studentId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Student removed successfully!");
        fetchData();
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to remove student");
      }
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("Error removing student");
    }
  };

  const handleDeselectAll = () => {
    setSelectedStudents(new Set());
  };

  // Group all students by class
  const studentsByClass = availableStudents.reduce((acc, student) => {
    const classKey = `${student.class.id}-${student.class.name}`;
    if (!acc[classKey]) {
      acc[classKey] = {
        classId: student.class.id,
        className: student.class.name,
        students: []
      };
    }
    acc[classKey].students.push(student);
    return acc;
  }, {} as Record<string, { classId: number; className: string; students: Student[] }>);

  // Filter students within expanded class based on search
  const getFilteredStudentsForClass = (students: Student[]) => {
    if (!searchQuery) return students;
    return students.filter(student =>
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Track expanded classes
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());

  const toggleClassExpansion = (classId: number) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  const selectAllInClass = (students: Student[]) => {
    const newSelected = new Set(selectedStudents);
    students.forEach(student => newSelected.add(student.id));
    setSelectedStudents(newSelected);
  };

  const deselectAllInClass = (students: Student[]) => {
    const newSelected = new Set(selectedStudents);
    students.forEach(student => newSelected.delete(student.id));
    setSelectedStudents(newSelected);
  };

  if (!isOpen) return null;

  const capacityInfo = electiveSubject.maxStudents
    ? `${assignedStudents.length} / ${electiveSubject.maxStudents}`
    : `${assignedStudents.length}`;

  const isNearCapacity = electiveSubject.maxStudents
    ? assignedStudents.length >= electiveSubject.maxStudents * 0.9
    : false;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Assign Students - {electiveSubject.subject.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {electiveGroup.name} • {electiveGroup.branch.shortName}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                isNearCapacity
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                Capacity: {capacityInfo}
              </span>
              {selectedStudents.size > 0 && (
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                  {selectedStudents.size} selected
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Available Students by Class (2 columns) */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Select Classes & Students
                  </h3>
                  <button
                    onClick={handleDeselectAll}
                    disabled={selectedStudents.size === 0}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
                  >
                    Deselect All ({selectedStudents.size})
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students by name or ID..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Class List - Accordion Style */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {Object.keys(studentsByClass).length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No available students found</p>
                    </div>
                  ) : (
                    Object.values(studentsByClass).map(({ classId, className, students }) => {
                      const filteredStudents = getFilteredStudentsForClass(students);
                      const isExpanded = expandedClasses.has(classId);
                      const selectedInClass = students.filter(s => selectedStudents.has(s.id)).length;
                      
                      return (
                        <div key={classId} className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white hover:border-blue-300 transition-colors">
                          {/* Class Header - Clickable */}
                          <button
                            onClick={() => toggleClassExpansion(classId)}
                            className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${isExpanded ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                              <div className="text-left">
                                <h4 className="font-bold text-gray-900">{className}</h4>
                                <p className="text-sm text-gray-600">
                                  {students.length} students
                                  {selectedInClass > 0 && (
                                    <span className="ml-2 text-blue-600 font-semibold">
                                      • {selectedInClass} selected
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isExpanded && (
                                <div className="flex gap-2 mr-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectAllInClass(filteredStudents);
                                    }}
                                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium"
                                  >
                                    Select All
                                  </button>
                                  {selectedInClass > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deselectAllInClass(students);
                                      }}
                                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>
                              )}
                              <ChevronDown
                                className={`w-5 h-5 text-gray-500 transition-transform ${
                                  isExpanded ? 'transform rotate-180' : ''
                                }`}
                              />
                            </div>
                          </button>

                          {/* Student List - Expandable */}
                          {isExpanded && (
                            <div className="px-4 py-3 bg-white border-t border-gray-200">
                              {filteredStudents.length === 0 ? (
                                <p className="text-center py-4 text-gray-500 text-sm">
                                  No students match your search
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {filteredStudents.map((student) => (
                                    <label
                                      key={student.id}
                                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        selectedStudents.has(student.id)
                                          ? "border-blue-500 bg-blue-50"
                                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedStudents.has(student.id)}
                                        onChange={() => handleStudentToggle(student.id)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">
                                          {student.firstName} {student.lastName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {student.studentId}
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Assign Button - Fixed at bottom */}
                {selectedStudents.size > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                    <button
                      onClick={handleAssignStudents}
                      disabled={submitting}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 font-bold text-lg"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Assigning...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Assign {selectedStudents.size} Student(s) to Elective
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Assigned Students */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Currently Assigned ({assignedStudents.length})
                </h3>

                <div className="space-y-2 max-h-[620px] overflow-y-auto">
                  {assignedStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No students assigned yet</p>
                      <p className="text-xs mt-1">Select students to assign</p>
                    </div>
                  ) : (
                    assignedStudents.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">
                              {assignment.student.firstName} {assignment.student.lastName}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              ID: {assignment.student.studentId}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Class: {assignment.student.class.name}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveStudent(assignment.student.id)}
                            className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="Remove student"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentAssignmentModal;

