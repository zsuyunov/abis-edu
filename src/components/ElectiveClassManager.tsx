'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  Settings,
  Eye,
  Edit,
  Archive,
  RotateCcw,
  Trash2,
  MoreVertical,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import ElectiveClassCreator from './ElectiveClassCreator';
import ElectiveClassStudentManager from './ElectiveClassStudentManager';

interface ElectiveClass {
  id: number;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  branch: {
    id: number;
    shortName: string;
    legalName: string;
  };
  academicYear: {
    id: number;
    name: string;
  };
  class: {
    id: number;
    name: string;
  };
  subjects: ElectiveClassSubject[];
}

interface ElectiveClassSubject {
  id: number;
  maxStudents: number | null;
  description: string;
  status: string;
  teacherIds: string[];
  subject: {
    id: number;
    name: string;
  };
  studentAssignments: {
    id: number;
    studentId: string;
    status: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      studentId: string;
    };
  }[];
}

interface ElectiveClassManagerProps {
  branchId: number;
  academicYearId: number;
}

export default function ElectiveClassManager({
  branchId,
  academicYearId,
}: ElectiveClassManagerProps) {
  const [electiveClasses, setElectiveClasses] = useState<ElectiveClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ElectiveClass | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingClass, setEditingClass] = useState<ElectiveClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<ElectiveClass | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchElectiveClasses();
  }, [branchId, academicYearId]);

  const fetchElectiveClasses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/elective-classes?branchId=${branchId}&academicYearId=${academicYearId}&status=ACTIVE`
      );
      const data = await response.json();
      if (data.success) {
        setElectiveClasses(data.data);
      } else {
        toast.error('Failed to fetch elective classes');
      }
    } catch (error) {
      console.error('Error fetching elective classes:', error);
      toast.error('Failed to fetch elective classes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (classId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/elective-classes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: classId,
          status: newStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Elective class ${newStatus.toLowerCase()} successfully`);
        fetchElectiveClasses();
        if (selectedClass?.id === classId) {
          setSelectedClass(null);
        }
      } else {
        toast.error(data.error || 'Failed to update elective class');
      }
    } catch (error) {
      console.error('Error updating elective class:', error);
      toast.error('Failed to update elective class');
    }
  };

  const handleEditClass = (electiveClass: ElectiveClass) => {
    setEditingClass(electiveClass);
    setShowEditModal(true);
  };

  const handleDeleteClass = async (electiveClass: ElectiveClass) => {
    try {
      // Check if there are any student assignments
      const hasStudentAssignments = electiveClass.subjects.some(subject =>
        (subject as any)._count?.studentAssignments > 0
      );

      if (hasStudentAssignments) {
        toast.error('Cannot delete elective class with student assignments. Please remove all student assignments first.');
        return;
      }

      const response = await fetch('/api/elective-classes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: electiveClass.id,
          status: 'ARCHIVED',
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Elective class deleted successfully');
        fetchElectiveClasses();
        setShowDeleteModal(false);
        setDeletingClass(null);
        if (selectedClass?.id === electiveClass.id) {
          setSelectedClass(null);
        }
      } else {
        toast.error(data.error || 'Failed to delete elective class');
      }
    } catch (error) {
      console.error('Error deleting elective class:', error);
      toast.error('Failed to delete elective class');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalStudents = (electiveClass: ElectiveClass) => {
    const studentIds = new Set();
    electiveClass.subjects.forEach(subject => {
      subject.studentAssignments
        .filter(assignment => assignment.status === 'ACTIVE')
        .forEach(assignment => studentIds.add(assignment.studentId));
    });
    return studentIds.size;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading elective classes...</p>
        </div>
      </div>
    );
  }

  if (selectedClass) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setSelectedClass(null)}
              className="p-2"
            >
              ←
            </Button>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-purple-600" />
                {selectedClass.name}
              </h2>
              <p className="text-gray-600">
                {selectedClass.class.name} • {selectedClass.branch.shortName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(selectedClass.status)}>
              {selectedClass.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(selectedClass.id, 'ARCHIVED')}
              className="text-orange-600 hover:text-orange-700"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subjects & Students</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                      <p className="text-2xl font-bold">{selectedClass.subjects.length}</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold">{getTotalStudents(selectedClass)}</p>
                    </div>
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Created</p>
                      <p className="text-2xl font-bold">
                        {new Date(selectedClass.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {selectedClass.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{selectedClass.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Subject Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Subjects Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedClass.subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{subject.subject.name}</p>
                          {subject.description && (
                            <p className="text-sm text-gray-500">{subject.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                          {subject.studentAssignments.filter(a => a.status === 'ACTIVE').length}
                          {subject.maxStudents ? `/${subject.maxStudents}` : ''} students
                        </Badge>
                        <Badge variant="outline">
                          {subject.teacherIds.length} teacher{subject.teacherIds.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            {selectedClass.subjects.map((subject) => (
              <Card key={subject.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    {subject.subject.name}
                  </CardTitle>
                  {subject.description && (
                    <CardDescription>{subject.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ElectiveClassStudentManager
                    electiveClassSubject={{
                      ...subject,
                      studentAssignments: subject.studentAssignments.map(assignment => ({
                        ...assignment,
                        assignedAt: new Date().toISOString(), // Default to current time
                        assignedBy: 'system', // Default value
                        student: {
                          ...assignment.student,
                          class: {
                            id: selectedClass.class.id,
                            name: selectedClass.class.name,
                          },
                        },
                      })),
                      electiveClass: {
                        id: selectedClass.id,
                        name: selectedClass.name,
                        class: selectedClass.class,
                      },
                    }}
                    onAssignmentsUpdated={fetchElectiveClasses}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Elective Class Settings
                </CardTitle>
                <CardDescription>
                  Manage the settings and status of this elective class
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Name</p>
                    <p className="text-lg">{selectedClass.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge className={getStatusColor(selectedClass.status)}>
                      {selectedClass.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Class</p>
                    <p className="text-lg">{selectedClass.class.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Academic Year</p>
                    <p className="text-lg">{selectedClass.academicYear.name}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Actions</h4>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedClass.id, 'ARCHIVED')}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Class
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-purple-600" />
            Elective Classes
          </h2>
          <p className="text-gray-600">
            Manage elective classes for single class assignments
          </p>
        </div>
        <ElectiveClassCreator
          branchId={branchId}
          academicYearId={academicYearId}
          onElectiveClassCreated={fetchElectiveClasses}
        />
      </div>

      {/* Elective Classes Grid */}
      {electiveClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Elective Classes</h3>
              <p className="text-gray-500 mb-6">
                Use the "Add Elective Class" button above to create your first elective class.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {electiveClasses.map((electiveClass) => (
            <Card key={electiveClass.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{electiveClass.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {electiveClass.class.name} • {electiveClass.branch.shortName}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(electiveClass.status)}>
                      {electiveClass.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedClass(electiveClass)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClass(electiveClass)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setDeletingClass(electiveClass);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {electiveClass.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {electiveClass.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>{electiveClass.subjects.length} subjects</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-green-600" />
                      <span>{getTotalStudents(electiveClass)} students</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedClass(electiveClass)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Elective Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingClass?.name}"? This action cannot be undone.
              {deletingClass?.subjects.some(s => (s as any)._count?.studentAssignments > 0) &&
                " Note: This class has student assignments that will also be removed."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingClass && handleDeleteClass(deletingClass)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Elective Class</DialogTitle>
            <DialogDescription>
              Update the elective class information and manage subject assignments.
            </DialogDescription>
          </DialogHeader>
          {editingClass && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Class</label>
                  <p className="text-gray-600">{editingClass.class.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Branch</label>
                  <p className="text-gray-600">{editingClass.branch.shortName}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Current Subjects ({editingClass.subjects.length})</label>
                <div className="mt-2 space-y-2">
                  {editingClass.subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium">{subject.subject.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          Max: {subject.maxStudents || 'No limit'}
                        </span>
                        <Button size="sm" variant="outline">
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-2" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // TODO: Implement save functionality
              setShowEditModal(false);
              setEditingClass(null);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
