'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, UserPlus, UserMinus, Search, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  class: {
    id: number;
    name: string;
  };
  branch: {
    id: number;
    shortName: string;
    legalName: string;
  };
}

interface Assignment {
  id: number;
  studentId: string;
  assignedAt: string;
  assignedBy: string;
  status: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    class: {
      id: number;
      name: string;
    };
  };
}

interface ElectiveClassSubject {
  id: number;
  maxStudents: number | null;
  description: string;
  subject: {
    id: number;
    name: string;
  };
  electiveClass: {
    id: number;
    name: string;
    class: {
      id: number;
      name: string;
    };
  };
  studentAssignments: Assignment[];
}

interface ElectiveClassStudentManagerProps {
  electiveClassSubject: ElectiveClassSubject;
  onAssignmentsUpdated?: () => void;
}

export default function ElectiveClassStudentManager({
  electiveClassSubject,
  onAssignmentsUpdated,
}: ElectiveClassStudentManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  const currentAssignments = electiveClassSubject.studentAssignments || [];
  const maxStudents = electiveClassSubject.maxStudents;
  const currentCount = currentAssignments.length;
  const canAddMore = !maxStudents || currentCount < maxStudents;

  // Fetch available students when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableStudents();
    }
  }, [isOpen, electiveClassSubject.id]);

  const fetchAvailableStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await fetch(
        `/api/students-by-class?classId=${electiveClassSubject.electiveClass.class.id}&status=ACTIVE&excludeElectiveClassSubjectId=${electiveClassSubject.id}`
      );
      const data = await response.json();
      if (data.success) {
        setAvailableStudents(data.data);
      } else {
        toast.error('Failed to fetch available students');
      }
    } catch (error) {
      console.error('Error fetching available students:', error);
      toast.error('Failed to fetch available students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      if (maxStudents && selectedStudents.length >= (maxStudents - currentCount)) {
        toast.error(`Cannot select more than ${maxStudents - currentCount} students (limit: ${maxStudents})`);
        return;
      }
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const maxSelectable = maxStudents ? maxStudents - currentCount : filteredStudents.length;
      const selectableStudents = filteredStudents
        .filter(student => !selectedStudents.includes(student.id))
        .slice(0, maxSelectable)
        .map(student => student.id);

      if (selectableStudents.length > 0) {
        setSelectedStudents([...selectedStudents, ...selectableStudents]);
      }
    } else {
      const filteredStudentIds = filteredStudents.map(student => student.id);
      setSelectedStudents(selectedStudents.filter(id => !filteredStudentIds.includes(id)));
    }
  };

  const handleAssignStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/elective-class-student-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          electiveClassSubjectId: electiveClassSubject.id,
          studentIds: selectedStudents,
          assignedBy: 'admin', // TODO: Get from auth context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`Successfully assigned ${data.data.length} students`);
          setSelectedStudents([]);
          setIsOpen(false);
          if (onAssignmentsUpdated) {
            onAssignmentsUpdated();
          }
        } else {
          // Handle detailed error messages for conflicts
          if (data.details && Array.isArray(data.details)) {
            // Show the first conflict error (there might be multiple)
            toast.error(data.details[0]);
          } else {
            toast.error(data.error || 'Failed to assign students');
          }
        }
      } else {
        // Handle HTTP error responses (like 409)
        try {
          const errorData = await response.json();
          if (errorData.details && Array.isArray(errorData.details)) {
            toast.error(errorData.details[0]);
          } else {
            toast.error(errorData.error || `Failed to assign students (${response.status})`);
          }
        } catch (parseError) {
          toast.error(`Failed to assign students (${response.status})`);
        }
      }
} catch (error) {
  console.error('Error assigning students:', error);
  toast.error('Failed to assign students');
} finally {
  setIsLoading(false);
}
  };

  const handleRemoveStudent = async (assignmentId: number, studentName: string) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from this elective subject?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/elective-class-student-assignments?id=${assignmentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Successfully removed ${studentName}`);
        if (onAssignmentsUpdated) {
          onAssignmentsUpdated();
        }
      } else {
        toast.error(data.error || 'Failed to remove student');
      }
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Failed to remove student');
    }
  };

  const filteredStudents = availableStudents.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assigned Students
              <Badge variant="secondary">
                {currentCount}{maxStudents ? `/${maxStudents}` : ''}
              </Badge>
            </span>
            {canAddMore && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Students
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-green-600" />
                      Assign Students to {electiveClassSubject.subject.name}
                    </DialogTitle>
                    <DialogDescription>
                      Select students from {electiveClassSubject.electiveClass.class.name} to assign to this elective subject.
                      {maxStudents && (
                        <span className="block mt-1 text-orange-600">
                          Limit: {maxStudents} students (Currently: {currentCount})
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search students by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-10 h-12 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      />
                      {searchTerm && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      )}
                    </div>

                    {/* Selected count */}
                    {selectedStudents.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-900">
                              {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                            </p>
                            {maxStudents && (
                              <p className="text-sm text-blue-700">
                                {maxStudents - currentCount - selectedStudents.length} slots remaining
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStudents([])}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Student list */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {loadingStudents ? (
                        <div className="text-center py-8 text-gray-500">
                          Loading students...
                        </div>
                      ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No available students found</p>
                          {searchTerm && (
                            <p className="text-sm">Try adjusting your search terms</p>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Select All Toggle */}
                          <div className="flex items-center justify-between p-3 mb-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id="select-all"
                                checked={
                                  filteredStudents.length > 0 &&
                                  filteredStudents.every(student => selectedStudents.includes(student.id))
                                }
                                onCheckedChange={handleSelectAll}
                                disabled={
                                  !!(maxStudents && selectedStudents.length >= (maxStudents - currentCount))
                                }
                              />
                              <div>
                                <p className="font-medium text-blue-900">Select All Visible</p>
                                <p className="text-sm text-blue-700">
                                  {filteredStudents.length} students • {maxStudents ?
                                    `${maxStudents - currentCount - selectedStudents.length} slots remaining` :
                                    'No limit'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>

                          {filteredStudents.map((student) => {
                            const isSelected = selectedStudents.includes(student.id);
                            const isDisabled = !isSelected && !!maxStudents && selectedStudents.length >= (maxStudents - currentCount);

                            return (
                              <div
                                key={student.id}
                                className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-all duration-200 ${
                                  isSelected
                                    ? 'border-blue-300 bg-blue-50 shadow-sm'
                                    : isDisabled
                                    ? 'border-gray-200 bg-gray-50 opacity-60'
                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                                }`}
                              >
                                <Checkbox
                                  id={student.id}
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handleStudentSelection(student.id, checked as boolean)
                                  }
                                  disabled={!!isDisabled}
                                  className={isDisabled ? 'opacity-50' : ''}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                      </div>
                                      <div>
                                        <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                          {student.firstName} {student.lastName}
                                        </p>
                                        <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                                          ID: {student.studentId}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <Badge
                                        variant={isSelected ? "default" : "outline"}
                                        className={isSelected ? "bg-blue-600" : ""}
                                      >
                                        {student.class.name}
                                      </Badge>
                                      {isDisabled && (
                                        <p className="text-xs text-red-500 mt-1">Limit reached</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAssignStudents}
                        disabled={isLoading || selectedStudents.length === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isLoading ? 'Assigning...' : `Assign ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
          <CardDescription>
            Students assigned to {electiveClassSubject.subject.name} in {electiveClassSubject.electiveClass.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No students assigned yet</p>
              {canAddMore && (
                <p className="text-sm">Click "Assign Students" to get started</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {currentAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {assignment.student.firstName[0]}{assignment.student.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {assignment.student.firstName} {assignment.student.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {assignment.student.studentId} • Class: {assignment.student.class.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {assignment.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveStudent(
                        assignment.id,
                        `${assignment.student.firstName} ${assignment.student.lastName}`
                      )}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!canAddMore && maxStudents && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800">
                Maximum student limit reached ({currentCount}/{maxStudents})
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
