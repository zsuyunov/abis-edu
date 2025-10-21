'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Plus, X, Users, BookOpen, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface Class {
  id: number;
  name: string;
  capacity: number;
  academicYearId: number;
  branchId: number;
  status: string;
  academicYear: {
    id: number;
    name: string;
  };
  branch: {
    id: number;
    shortName: string;
    legalName: string;
  };
  _count: {
    students: number;
  };
}

interface Subject {
  id: number;
  name: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  teacherId: string;
}

interface ElectiveClassCreatorProps {
  branchId: number;
  academicYearId: number;
  onElectiveClassCreated?: () => void;
}

export default function ElectiveClassCreator({
  branchId,
  academicYearId,
  onElectiveClassCreated,
}: ElectiveClassCreatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    classId: '',
    description: '',
  });

  // Subject assignments state
  const [subjectAssignments, setSubjectAssignments] = useState<{
    subjectId: string;
    teacherIds: string[];
    maxStudents: string;
    description: string;
  }[]>([]);

  // Fetch classes on component mount
  useEffect(() => {
    if (branchId) {
      fetchClasses();
      fetchSubjects();
      fetchTeachers();
    }
  }, [branchId, academicYearId]);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const response = await fetch(
        `/api/classes-by-branch?branchId=${branchId}&academicYearId=${academicYearId}&status=ACTIVE`
      );
      const data = await response.json();
      if (data.success) {
        setClasses(data.data);
      } else {
        toast.error('Failed to fetch classes');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await fetch('/api/subjects?status=ACTIVE');
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data);
      } else {
        toast.error('Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch subjects');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const response = await fetch(`/api/teachers?branchId=${branchId}&status=ACTIVE`);
      const data = await response.json();
      if (data.success) {
        setTeachers(data.data);
      } else {
        toast.error('Failed to fetch teachers');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to fetch teachers');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const addSubjectAssignment = () => {
    setSubjectAssignments([
      ...subjectAssignments,
      {
        subjectId: '',
        teacherIds: [],
        maxStudents: '',
        description: '',
      },
    ]);
  };

  const removeSubjectAssignment = (index: number) => {
    setSubjectAssignments(subjectAssignments.filter((_, i) => i !== index));
  };

  const updateSubjectAssignment = (index: number, field: string, value: any) => {
    const updated = [...subjectAssignments];
    updated[index] = { ...updated[index], [field]: value };
    setSubjectAssignments(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.classId) {
      toast.error('Please select a class');
      return;
    }

    // Subject assignments are optional - can be added later
    // if (subjectAssignments.length === 0) {
    //   toast.error('Please add at least one subject assignment');
    //   return;
    // }

    // Validate subject assignments
    for (let i = 0; i < subjectAssignments.length; i++) {
      const assignment = subjectAssignments[i];
      if (!assignment.subjectId) {
        toast.error(`Please select a subject for assignment ${i + 1}`);
        return;
      }
      if (assignment.teacherIds.length === 0) {
        toast.error(`Please assign at least one teacher for assignment ${i + 1}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      // Get the selected class to generate the name
      const selectedClass = classes.find(c => c.id.toString() === formData.classId);
      const generatedName = `${selectedClass?.name || 'Class'} - Electives`;

      // Create elective class
      const electiveClassResponse = await fetch('/api/elective-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: generatedName,
          description: formData.description,
          branchId,
          academicYearId,
          classId: parseInt(formData.classId),
          createdBy: 'admin', // TODO: Get from auth context
        }),
      });

      const electiveClassData = await electiveClassResponse.json();
      if (!electiveClassData.success) {
        toast.error(electiveClassData.error || 'Failed to create elective class');
        return;
      }

      const electiveClassId = electiveClassData.data.id;

      // Create subject assignments
      for (const assignment of subjectAssignments) {
        const subjectResponse = await fetch('/api/elective-class-subjects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            electiveClassId,
            subjectId: parseInt(assignment.subjectId),
            teacherIds: assignment.teacherIds,
            maxStudents: assignment.maxStudents ? parseInt(assignment.maxStudents) : null,
            description: assignment.description,
          }),
        });

        const subjectData = await subjectResponse.json();
        if (!subjectData.success) {
          toast.error(`Failed to create subject assignment: ${subjectData.error}`);
          return;
        }
      }

      toast.success('Elective class created successfully!');
      
      // Reset form
      setFormData({
        classId: '',
        description: '',
      });
      setSubjectAssignments([]);
      
      if (onElectiveClassCreated) {
        onElectiveClassCreated();
      }
      
      // Dialog will close automatically with DialogClose wrapper
    } catch (error) {
      console.error('Error creating elective class:', error);
      toast.error('Failed to create elective class');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedClass = classes.find(c => c.id.toString() === formData.classId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Elective Class
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Create Elective Class
          </DialogTitle>
          <DialogDescription>
            Create an elective class for a specific class. Students from only the selected class can be assigned to subjects in this elective class.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>
                Select a class to create electives for. The name will be generated automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="classId">Select Class *</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value: string) => setFormData({ ...formData, classId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingClasses ? "Loading classes..." : "Select a class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{cls.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({cls._count.students}/{cls.capacity} students)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedClass && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedClass.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">
                        {selectedClass.name} - Electives
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {selectedClass._count.students} active students • {selectedClass.branch.shortName}
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        This will be the name of your elective class
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add any additional notes or description for this elective class"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Subject Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Subject Assignments
                </span>
                <Button
                  type="button"
                  onClick={addSubjectAssignment}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </CardTitle>
              <CardDescription>
                Assign subjects and their teachers for this elective class (optional - can be added later)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjectAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No subject assignments yet</p>
                  <p className="text-sm">Click "Add Subject" to assign subjects, or create the elective class now and add subjects later</p>
                </div>
              ) : (
                subjectAssignments.map((assignment, index) => (
                  <Card key={index} className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-medium">Subject Assignment {index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => removeSubjectAssignment(index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Subject *</Label>
                          <Select
                            value={assignment.subjectId}
                            onValueChange={(value: string) => updateSubjectAssignment(index, 'subjectId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={loadingSubjects ? "Loading..." : "Select subject"} />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id.toString()}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Max Students</Label>
                          <Input
                            type="number"
                            value={assignment.maxStudents}
                            onChange={(e) => updateSubjectAssignment(index, 'maxStudents', e.target.value)}
                            placeholder="Optional limit"
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label>Assigned Teachers *</Label>
                        <Select
                          value=""
                          onValueChange={(value: string) => {
                            if (!assignment.teacherIds.includes(value)) {
                              updateSubjectAssignment(index, 'teacherIds', [...assignment.teacherIds, value]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingTeachers ? "Loading..." : "Add teacher"} />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers
                              .filter(teacher => !assignment.teacherIds.includes(teacher.id))
                              .map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        
                        {assignment.teacherIds.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {assignment.teacherIds.map((teacherId) => {
                              const teacher = teachers.find(t => t.id === teacherId);
                              return teacher ? (
                                <div
                                  key={teacherId}
                                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                                >
                                  <Users className="w-3 h-3" />
                                  {teacher.firstName} {teacher.lastName}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateSubjectAssignment(
                                        index,
                                        'teacherIds',
                                        assignment.teacherIds.filter(id => id !== teacherId)
                                      );
                                    }}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={assignment.description}
                          onChange={(e) => updateSubjectAssignment(index, 'description', e.target.value)}
                          placeholder="Optional description for this subject assignment"
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Creating...' : 'Create Elective Class'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
