"use client";

import { useState, useEffect } from "react";
import { X, Save, Search, BookOpen, Users as UsersIcon, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

interface Subject {
  id: number;
  name: string;
  status: string;
}

interface SubjectAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  electiveGroup: {
    id: number;
    name: string;
    branch: {
      id: number;
      shortName: string;
    };
    academicYear: {
      id: number;
      name: string;
    };
  };
  onSuccess: () => void;
}

const SubjectAssignmentModal = ({
  isOpen,
  onClose,
  electiveGroup,
  onSuccess
}: SubjectAssignmentModalProps) => {
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<number>>(new Set());
  const [maxStudents, setMaxStudents] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, electiveGroup.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch available subjects and assigned subjects
      const [availableRes, assignedRes] = await Promise.all([
        fetch(`/api/admin/electives/available-subjects?branchId=${electiveGroup.branch.id}&academicYearId=${electiveGroup.academicYear.id}&electiveGroupId=${electiveGroup.id}`),
        fetch(`/api/admin/electives/${electiveGroup.id}/subjects`)
      ]);

      if (availableRes.ok) {
        const data = await availableRes.json();
        setAvailableSubjects(data.data || []);
      }

      if (assignedRes.ok) {
        const data = await assignedRes.json();
        setAssignedSubjects(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: number) => {
    const newSelected = new Set(selectedSubjects);
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId);
    } else {
      newSelected.add(subjectId);
    }
    setSelectedSubjects(newSelected);
  };

  const handleAssignSubjects = async () => {
    if (selectedSubjects.size === 0) {
      toast.error("Please select at least one subject");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/admin/electives/${electiveGroup.id}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectIds: Array.from(selectedSubjects),
          maxStudents: maxStudents ? parseInt(maxStudents) : null,
          description: description || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Subjects assigned successfully!");
        setSelectedSubjects(new Set());
        setMaxStudents("");
        setDescription("");
        onSuccess();
        fetchData(); // Refresh the data
      } else {
        toast.error(data.error || "Failed to assign subjects");
      }
    } catch (error) {
      console.error("Error assigning subjects:", error);
      toast.error("Error assigning subjects");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSubject = async (electiveSubjectId: number) => {
    if (!confirm("Are you sure you want to remove this subject from the elective group?")) return;

    try {
      const response = await fetch(
        `/api/admin/electives/${electiveGroup.id}/subjects?electiveSubjectId=${electiveSubjectId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Subject removed successfully!");
        fetchData();
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to remove subject");
      }
    } catch (error) {
      console.error("Error removing subject:", error);
      toast.error("Error removing subject");
    }
  };

  const filteredSubjects = availableSubjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Assign Subjects - {electiveGroup.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {electiveGroup.branch.shortName} • {electiveGroup.academicYear.name}
            </p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Available Subjects */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Available Subjects ({filteredSubjects.length})
                </h3>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search subjects..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Subject List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredSubjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No available subjects found</p>
                    </div>
                  ) : (
                    filteredSubjects.map((subject) => (
                      <label
                        key={subject.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedSubjects.has(subject.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjects.has(subject.id)}
                          onChange={() => handleSubjectToggle(subject.id)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{subject.name}</span>
                          <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                            subject.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {subject.status}
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                {/* Assignment Options */}
                {selectedSubjects.size > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Assignment Options
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Students (Optional)
                        </label>
                        <input
                          type="number"
                          value={maxStudents}
                          onChange={(e) => setMaxStudents(e.target.value)}
                          placeholder="e.g., 30"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (Optional)
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Additional information..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAssignSubjects}
                      disabled={submitting}
                      className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Assign {selectedSubjects.size} Subject(s)
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Assigned Subjects */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Currently Assigned ({assignedSubjects.length})
                </h3>

                <div className="space-y-3 max-h-[550px] overflow-y-auto">
                  {assignedSubjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No subjects assigned yet</p>
                      <p className="text-sm mt-1">Select subjects from the left to assign</p>
                    </div>
                  ) : (
                    assignedSubjects.map((electiveSubject) => (
                      <div
                        key={electiveSubject.id}
                        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {electiveSubject.subject.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <UsersIcon className="w-4 h-4" />
                                {electiveSubject._count.studentAssignments} Student(s)
                              </span>
                              <span>•</span>
                              <span>{electiveSubject.teacherIds.length} Teacher(s)</span>
                              {electiveSubject.maxStudents && (
                                <>
                                  <span>•</span>
                                  <span>Max: {electiveSubject.maxStudents}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSubject(electiveSubject.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        {electiveSubject.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {electiveSubject.description}
                          </p>
                        )}
                        <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                          electiveSubject.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : electiveSubject.status === 'FULL'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {electiveSubject.status}
                        </span>
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
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectAssignmentModal;

