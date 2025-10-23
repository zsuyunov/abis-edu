'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Plus, X, Users, BookOpen, GraduationCap, Search, Check, ArrowLeft, ArrowRight } from 'lucide-react';
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
  status: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
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

  // Multi-step workflow state
  const [currentStep, setCurrentStep] = useState<'class' | 'subjects' | 'students'>('class');
  const [isOpen, setIsOpen] = useState(false);

  // Subject selection state (like SubjectAssignmentModal)
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

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
      const response = await fetch(`/api/subjects?branchId=${branchId}&academicYearId=${academicYearId}`);
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
      const response = await fetch(`/api/teachers/optimized?page=1&limit=100`);
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

  // Multi-step workflow functions
  const handleClassSelection = () => {
    if (!formData.classId) {
      toast.error('Please select a class');
      return;
    }
    setCurrentStep('subjects');
    fetchSubjectsForAssignment();
  };

  const handleSubjectAssignment = () => {
    if (selectedSubjects.size === 0) {
      toast.error('Please select at least one subject');
        return;
      }
    setCurrentStep('students');
  };

  const fetchSubjectsForAssignment = async () => {
    try {
      setLoadingSubjects(true);
      const response = await fetch(`/api/subjects?branchId=${branchId}&academicYearId=${academicYearId}`);
      const data = await response.json();
      if (data.success) {
        setAvailableSubjects(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch subjects');
    } finally {
      setLoadingSubjects(false);
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
    try {
    setIsLoading(true);

      const selectedSubjectIds = Array.from(selectedSubjects);

      // First create the elective class
      const createResponse = await fetch('/api/elective-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${selectedClass?.name} Electives`, // Generate name from class
          description: formData.description,
          branchId: selectedClass?.branchId,
          academicYearId: academicYearId,
          classId: parseInt(formData.classId),
          createdBy: 'admin', // This should come from auth context
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        // Handle detailed error messages for conflicts
        if (error.details && Array.isArray(error.details)) {
          toast.error(error.details[0]);
        } else {
          toast.error(error.error || 'Failed to create elective class');
        }
        return;
      }

      const createData = await createResponse.json();
      const electiveClassId = createData.data.id;

      // Then assign subjects to the created elective class
      const assignResponse = await fetch(`/api/elective-classes/${electiveClassId}/subjects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
          subjectIds: selectedSubjectIds,
          maxStudents: 30, // Default max students
          }),
        });

      if (assignResponse.ok) {
        toast.success('Elective class created and subjects assigned successfully');
        resetForm();
      if (onElectiveClassCreated) {
        onElectiveClassCreated();
      }
      } else {
        const error = await assignResponse.json();
        toast.error(error.error || 'Failed to assign subjects');
      }
    } catch (error) {
      console.error('Error creating elective class:', error);
      toast.error('Failed to create elective class');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('class');
    setFormData({
      classId: '',
      description: '',
    });
    setSelectedSubjects(new Set());
    setSearchQuery('');
    setIsOpen(false);
  };

  const selectedClass = classes.find(c => c.id.toString() === formData.classId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Elective Class
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Create Elective Class
          </DialogTitle>
          <DialogDescription>
            Create an elective class for a specific class. Students from only the selected class can be assigned to subjects in this elective class.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className={`flex items-center space-x-2 ${currentStep === 'class' ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'class' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="text-sm font-medium">Select Class</span>
          </div>
          <div className={`w-8 h-0.5 ${currentStep === 'subjects' || currentStep === 'students' ? 'bg-purple-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center space-x-2 ${currentStep === 'subjects' ? 'text-purple-600' : currentStep === 'students' ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'subjects' || currentStep === 'students' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="text-sm font-medium">Assign Subjects</span>
          </div>
          <div className={`w-8 h-0.5 ${currentStep === 'students' ? 'bg-purple-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center space-x-2 ${currentStep === 'students' ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'students' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="text-sm font-medium">Assign Students</span>
          </div>
        </div>

        {/* Step 1: Class Selection */}
        {currentStep === 'class' && (
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm relative z-10">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="text-lg text-gray-900">Basic Information</CardTitle>
                <CardDescription className="text-gray-600">
                Select a class to create electives for. The name will be generated automatically.
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-4 bg-white p-6">
              <div className="space-y-2">
                <Label htmlFor="classId">Select Class *</Label>
                <Select
                  value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                >
                    <SelectTrigger className="w-full h-12 bg-white border-2 border-gray-300 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200">
                      <SelectValue placeholder="Select a class" className="text-gray-700" />
                  </SelectTrigger>
                    <SelectContent className="w-full bg-white border-2 border-gray-200 shadow-xl z-[300] max-h-64 overflow-y-auto">
                      {loadingClasses ? (
                        <SelectItem value="loading" disabled className="text-gray-500">
                          <div className="flex items-center justify-center py-2">
                            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Loading classes...
                          </div>
                        </SelectItem>
                      ) : classes.length === 0 ? (
                        <SelectItem value="no-classes" disabled className="text-gray-500">
                          No classes found
                        </SelectItem>
                      ) : (
                        classes.map((cls) => (
                          <SelectItem
                            key={cls.id}
                            value={cls.id.toString()}
                            className="cursor-pointer hover:bg-purple-50 focus:bg-purple-50 py-3 px-4 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{cls.name}</span>
                              <span className="text-sm text-gray-500">
                                {cls.branch.shortName} • {cls._count.students} students
                          </span>
                        </div>
                      </SelectItem>
                        ))
                      )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                    placeholder="Add any additional notes or description for this elective class"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

            <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  type="button"
                onClick={handleClassSelection}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                >
                Next: Assign Subjects
                <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
          </div>
        )}

        {/* Step 2: Subject Assignment */}
        {currentStep === 'subjects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Assign Subjects</h3>
                <p className="text-sm text-gray-600">
                  Select subjects to assign to {selectedClass?.name}
                </p>
                </div>
                        <Button
                          type="button"
                variant="outline"
                onClick={() => setCurrentStep('class')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
                        </Button>
                      </div>
                      
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 bg-white border-2 border-gray-300 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </Button>
              )}
                        </div>
                        
            {/* Subject Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Available Subjects */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-lg text-gray-900">Available Subjects ({availableSubjects.length})</CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto bg-white p-4">
                  {loadingSubjects ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <div className="text-gray-500">Loading subjects...</div>
                    </div>
                  ) : (
                        <div className="space-y-2">
                      {(() => {
                        const filteredSubjects = availableSubjects.filter(subject =>
                          subject.name.toLowerCase().includes(searchQuery.toLowerCase())
                        );

                        if (filteredSubjects.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-500">
                              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <div className="font-medium">No subjects found</div>
                              <div className="text-sm">
                                {searchQuery ? 'Try adjusting your search terms' : 'No subjects available'}
                        </div>
                      </div>
                          );
                        }

                        return filteredSubjects.map((subject) => (
                          <div
                            key={subject.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                              selectedSubjects.has(subject.id)
                                ? 'bg-purple-50 border-purple-300 shadow-sm'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                            }`}
                            onClick={() => handleSubjectToggle(subject.id)}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              selectedSubjects.has(subject.id)
                                ? 'bg-purple-600 border-purple-600'
                                : 'border-gray-300'
                            }`}>
                              {selectedSubjects.has(subject.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{subject.name}</div>
                              <div className="text-sm text-gray-500">{subject.status}</div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Subjects */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-lg text-gray-900">Selected Subjects ({selectedSubjects.size})</CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto bg-white p-4">
                  {selectedSubjects.size === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <div className="font-medium">No subjects selected</div>
                      <div className="text-sm">Select subjects from the left panel</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Array.from(selectedSubjects).map((subjectId) => {
                        const subject = availableSubjects.find(s => s.id === subjectId);
                        return subject ? (
                          <div
                            key={subject.id}
                            className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-gray-900">{subject.name}</div>
                              <div className="text-sm text-gray-500">{subject.status}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSubjectToggle(subject.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                </CardContent>
              </Card>
                      </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('class')}
                className="border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Class Selection
              </Button>
              <Button
                type="button"
                onClick={handleAssignSubjects}
                disabled={selectedSubjects.size === 0 || isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  <>
                    Next: Assign Students
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
                      </div>
        )}

        {/* Step 3: Student Assignment */}
        {currentStep === 'students' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Assign Students</h3>
                <p className="text-sm text-gray-600">
                  Assign students from {selectedClass?.name} to elective subjects
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('subjects')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>

            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">Student Assignment</h4>
              <p className="text-gray-500 mb-6">
                Student assignment functionality will be implemented in the next step.
                For now, you can create the elective class and assign students later.
              </p>
              
              <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                  onClick={() => setCurrentStep('subjects')}
                  className="border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50"
              >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Subjects
              </Button>
            <Button
                  type="button"
                  onClick={resetForm}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                >
                  Complete Setup
            </Button>
          </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
