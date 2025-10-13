'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit, 
  Archive, 
  RotateCcw, 
  Trash2, 
  Eye, 
  Filter,
  Plus,
  Search,
  Clock,
  Users,
  BookOpen,
  MapPin,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

interface Branch {
  id: number;
  shortName: string;
  legalName: string;
}

interface Class {
  id: number;
  name: string;
  branch: Branch;
}

interface AcademicYear {
  id: number;
  name: string;
  isCurrent: boolean;
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

interface Timetable {
  id: number;
  branchId: number;
  classId: number;
  academicYearId: number;
  dayOfWeek: string | null;
  subjectId: number | null;
  subjectIds: number[];
  teacherIds: string[];
  startTime: string | Date;
  endTime: string | Date;
  roomNumber: string | null;
  buildingName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch: Branch;
  class: Class;
  academicYear: AcademicYear;
  subject: Subject | null;
  subjects: Subject[];
  teachers?: Teacher[];
}

interface TimetableGrid {
  [timeSlot: string]: {
    [day: string]: Timetable | null;
  };
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TimetableManagementPage: React.FC = () => {
  // State
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [filteredTimetables, setFilteredTimetables] = useState<Timetable[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  // Filters
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTimetableId, setSelectedTimetableId] = useState<number | null>(null);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    startTime: '',
    endTime: '',
    subjectId: '',
    subjectIds: [] as number[],
    teacherIds: [] as string[]
  });
  const [filteredEditTeachers, setFilteredEditTeachers] = useState<any[]>([]);
  const [loadingEditTeachers, setLoadingEditTeachers] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchClasses(selectedBranch);
    }
  }, [selectedBranch]);

  useEffect(() => {
    fetchTimetables();
    fetchSubjects();
    fetchTeachers();
  }, [selectedBranch, selectedClass, selectedAcademicYear, showInactive]);


  useEffect(() => {
    applyFilters();
  }, [timetables, searchTerm, showInactive]);

  // Watch for changes in edit form subjectIds to filter teachers
  useEffect(() => {
    if (editModalOpen && editFormData.subjectIds) {
      fetchTeachersForEditSubjects(editFormData.subjectIds);
    }
  }, [editFormData.subjectIds, editModalOpen, selectedClass, selectedAcademicYear]);

  const fetchInitialData = async () => {
    try {
      const [branchesRes, academicYearsRes] = await Promise.all([
        fetch('/api/branches'),
        fetch('/api/academic-years')
      ]);

      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        setBranches(Array.isArray(branchesData) ? branchesData : []);
        // Auto-select the first branch to match saved timetables
        if (branchesData.length > 0) {
          // Look for branch with shortName "85" (with or without trailing space) first
          const branch85 = branchesData.find((b: Branch) => 
            b.shortName === '85' || b.shortName === '85 ' || b.shortName.trim() === '85'
          ) || branchesData[0];
          setSelectedBranch(branch85.id);
          console.log('Auto-selected branch:', branch85.id, branch85.shortName);
        }
      } else {
        setBranches([]);
      }

      if (academicYearsRes.ok) {
        const academicYearsData = await academicYearsRes.json();
        setAcademicYears(Array.isArray(academicYearsData) ? academicYearsData : []);
        // Auto-select current academic year
        const current = academicYearsData.find((year: AcademicYear) => year.isCurrent);
        if (current) {
          setSelectedAcademicYear(current.id);
        }
      } else {
        setAcademicYears([]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setBranches([]);
      setAcademicYears([]);
      setError('Failed to load initial data');
    }
  };

  const fetchClasses = async (branchId: number) => {
    try {
      const response = await fetch(`/api/classes?branchId=${branchId}`);
      if (response.ok) {
        const data = await response.json();
        setClasses(Array.isArray(data) ? data : []);
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append('branchId', selectedBranch.toString());
      if (selectedClass) params.append('classId', selectedClass.toString());
      if (selectedAcademicYear) params.append('academicYearId', selectedAcademicYear.toString());
      // Don't filter by isActive - fetch all timetables and filter on frontend
      // This allows us to show both active and inactive based on showInactive toggle

      console.log('Fetching timetables with params:', params.toString());
      console.log('Selected filters:', { selectedBranch, selectedClass, selectedAcademicYear });
      
      // If no filters are selected, fetch all timetables to show something
      const url = params.toString() ? `/api/admin/timetables?${params}` : '/api/admin/timetables';
      const response = await fetch(url);
      console.log('Timetables response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Timetables data received:', data);
        console.log('Number of timetables found:', data.timetables?.length || 0);
        
        // Debug the first timetable's time fields
        if (data.timetables?.length > 0) {
          const firstTimetable = data.timetables[0];
          console.log('🔍 First timetable time fields:');
          console.log('  startTime:', firstTimetable.startTime, 'type:', typeof firstTimetable.startTime);
          console.log('  endTime:', firstTimetable.endTime, 'type:', typeof firstTimetable.endTime);
        }
        
        // Filter timetables on frontend if specific filters are applied
        let filteredTimetables = Array.isArray(data.timetables) ? data.timetables : [];
        
        if (selectedBranch || selectedClass || selectedAcademicYear) {
          filteredTimetables = filteredTimetables.filter((timetable: any) => {
            const branchMatch = !selectedBranch || timetable.branchId === selectedBranch;
            const classMatch = !selectedClass || timetable.classId === selectedClass;
            const yearMatch = !selectedAcademicYear || timetable.academicYearId === selectedAcademicYear;
            return branchMatch && classMatch && yearMatch;
          });
        }
        
        console.log('Filtered timetables count:', filteredTimetables.length);
        setTimetables(filteredTimetables);
      } else {
        const errorText = await response.text();
        console.error('Timetables fetch failed:', errorText);
        setTimetables([]);
        setError('Failed to fetch timetables');
      }
    } catch (error) {
      console.error('Error fetching timetables:', error);
      setTimetables([]);
      setError(error instanceof Error ? error.message : 'Failed to fetch timetables');
    } finally {
      setLoading(false);
    }
  };


  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(Array.isArray(data) ? data : []);
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(Array.isArray(data) ? data : []);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    }
  };

  const applyFilters = () => {
    let filtered = timetables;

    // Filter by active/inactive status based on showInactive toggle
    if (showInactive) {
      // Show only archived/inactive timetables
      filtered = filtered.filter(t => !t.isActive);
    } else {
      // Show only active timetables
      filtered = filtered.filter(t => t.isActive);
    }

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.buildingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.teachers?.some(teacher => 
          `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredTimetables(filtered);
  };

  // Helper functions
  const formatTime = (time: string | Date) => {
    if (!time) return '';
    
    try {
      let date: Date;
      
      if (typeof time === 'string') {
        // Handle different string formats
        if (time.includes('T')) {
          // ISO string format - parse as is
          date = new Date(time);
        } else if (time.includes(':')) {
          // Time format like "08:20" - treat as local time
          date = new Date(`1970-01-01T${time}:00`);
        } else {
          // Try direct conversion
          date = new Date(time);
        }
      } else {
        // Already a Date object
        date = time;
      }
      
      if (isNaN(date.getTime())) {
        console.error('❌ Invalid date:', time);
        return 'Invalid';
      }
      
      // Extract hours and minutes directly from the time string if possible
      if (typeof time === 'string' && time.includes(':')) {
        const [hours, minutes] = time.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }
      
      // For Date objects, use UTC methods to avoid timezone issues
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('❌ Error in formatTime:', error, 'for input:', time);
      return 'Error';
    }
  };

  const convertDayOfWeek = (day: string | null | undefined) => {
    // Handle null/undefined safely and default to Monday to avoid UI crash
    if (!day || typeof day !== 'string') return 'Monday';
    const upper = day.toUpperCase();
    const dayMap: { [key: string]: string } = {
      'MONDAY': 'Monday',
      'TUESDAY': 'Tuesday', 
      'WEDNESDAY': 'Wednesday',
      'THURSDAY': 'Thursday',
      'FRIDAY': 'Friday'
    };
    return dayMap[upper] || 'Monday';
  };

  const getSubjectNames = (subjectIds: number[] | null) => {
    if (!subjectIds || subjectIds.length === 0) return 'No subjects';
    return subjectIds.map(id => {
      const subject = subjects.find(s => s.id === id);
      return subject ? subject.name : `Subject ${id}`;
    }).join(', ');
  };

  const getTeacherNames = (teacherIds: string[]) => {
    if (!teacherIds || teacherIds.length === 0) return 'No teacher assigned';
    return teacherIds.map(id => {
      const teacher = teachers.find(t => t.id === id);
      return teacher ? `${teacher.firstName} ${teacher.lastName}` : `Teacher ${id}`;
    }).join(', ');
  };

  const fetchTeachersForEditSubjects = async (subjectIds: number[]) => {
    if (!subjectIds || subjectIds.length === 0) {
      setFilteredEditTeachers(teachers);
      return;
    }

    if (!selectedClass || !selectedAcademicYear) {
      setFilteredEditTeachers(teachers);
      return;
    }

    try {
      setLoadingEditTeachers(true);
      const response = await fetch(`/api/teachers/by-subjects?subjectIds=${subjectIds.join(',')}&classId=${selectedClass}&academicYearId=${selectedAcademicYear}`);
      
      if (response.ok) {
        const teachers = await response.json();
        setFilteredEditTeachers(teachers);
      } else {
        console.error('Failed to fetch teachers for subjects');
        setFilteredEditTeachers(teachers);
      }
    } catch (error) {
      console.error('Error fetching teachers for subjects:', error);
      setFilteredEditTeachers(teachers);
    } finally {
      setLoadingEditTeachers(false);
    }
  };

  const handleEditSubjectSelection = (subjectId: number) => {
    const currentIds = editFormData.subjectIds || [];
    const isSelected = currentIds.includes(subjectId);
    
    let newSubjectIds;
    if (isSelected) {
      newSubjectIds = currentIds.filter(id => id !== subjectId);
    } else {
      newSubjectIds = [...currentIds, subjectId];
    }
    
    setEditFormData({...editFormData, subjectIds: newSubjectIds});
  };

  const handleEdit = (timetable: any) => {
    setEditingTimetable(timetable);
    const subjectIds = timetable.subjectIds || (timetable.subjectId ? [timetable.subjectId] : []);
    setEditFormData({
      startTime: timetable.startTime,
      endTime: timetable.endTime,
      subjectId: subjectIds.length > 0 ? subjectIds[0].toString() : '',
      subjectIds: subjectIds,
      teacherIds: timetable.teacherIds || []
    });
    
    // Initialize filtered teachers
    setFilteredEditTeachers(teachers);
    fetchTeachersForEditSubjects(subjectIds);
    setEditModalOpen(true);
  };

  const handleUpdateTimetable = async () => {
    if (!editingTimetable) return;

    try {
      const updateData: any = {};
      
      // Only include changed fields
      if (editFormData.startTime !== editingTimetable.startTime) {
        updateData.startTime = editFormData.startTime;
      }
      if (editFormData.endTime !== editingTimetable.endTime) {
        updateData.endTime = editFormData.endTime;
      }
      // Handle subject updates - use subjectIds array for new structure
      if (editFormData.subjectIds && editFormData.subjectIds.length > 0) {
        updateData.subjectIds = editFormData.subjectIds;
        updateData.subjectId = editFormData.subjectIds[0]; // Keep for backward compatibility
      } else if (editFormData.subjectId) {
        updateData.subjectId = parseInt(editFormData.subjectId);
        updateData.subjectIds = [parseInt(editFormData.subjectId)];
      }
      if (JSON.stringify(editFormData.teacherIds) !== JSON.stringify(editingTimetable.teacherIds)) {
        updateData.teacherIds = editFormData.teacherIds;
      }

      // If no changes, close modal
      if (Object.keys(updateData).length === 0) {
        setEditModalOpen(false);
        return;
      }

      const response = await fetch(`/api/admin/timetables/${editingTimetable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

              if (response.ok) {
                const result = await response.json();
                setSuccess('Timetable updated successfully');
                setEditModalOpen(false);
                // Refresh the timetable list to show the updated/created entries
                fetchTimetables();
                setTimeout(() => setSuccess(null), 3000);
              } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update timetable');
              }
    } catch (error) {
      console.error('Error updating timetable:', error);
      setError('Failed to update timetable');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/timetables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false })
      });

      if (response.ok) {
        setSuccess('Timetable archived successfully');
        fetchTimetables();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to archive timetable');
      }
    } catch (error) {
      console.error('Error archiving timetable:', error);
      setError('Failed to archive timetable');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/timetables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      });

      if (response.ok) {
        setSuccess('Timetable restored successfully');
        fetchTimetables();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to restore timetable');
      }
    } catch (error) {
      console.error('Error restoring timetable:', error);
      setError('Failed to restore timetable');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    console.log('🗑️ Attempting to delete timetable with ID:', id);
    
    if (!confirm('Are you sure you want to delete this timetable entry? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('📡 Sending DELETE request to:', `/api/admin/timetables/${id}`);
      const response = await fetch(`/api/admin/timetables/${id}`, {
        method: 'DELETE'
      });

      console.log('📡 Delete response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Delete successful:', result);
        setSuccess('Timetable entry deleted successfully');
        fetchTimetables();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        console.error('❌ Delete failed:', errorData);
        throw new Error(`Failed to delete timetable: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error deleting timetable:', error);
      setError(`Failed to delete timetable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  const generateTimetableGrid = (): TimetableGrid => {
    const grid: TimetableGrid = {};
    
    console.log('🔍 Generating timetable grid with filteredTimetables:', filteredTimetables.length);
    console.log('📅 Sample timetable data:', filteredTimetables.slice(0, 2));
    
    // Create time slots based on timetables AND meal times
    const timeSlots = new Set<string>();
    
    // Collect all unique time slots from timetables
    filteredTimetables.forEach(timetable => {
      const startTime = formatTime(timetable.startTime);
      const endTime = formatTime(timetable.endTime);
      const timeSlot = `${startTime}-${endTime}`;
      timeSlots.add(timeSlot);
    });
    
    
    console.log('⏰ Found time slots from timetables and meals:', Array.from(timeSlots));
    
    // Sort time slots by start time
    const sortedTimeSlots = Array.from(timeSlots).sort((a, b) => {
      const [aStart] = a.split('-');
      const [bStart] = b.split('-');
      return aStart.localeCompare(bStart);
    });
    
    console.log('📋 Sorted time slots:', sortedTimeSlots);
    
    // Initialize grid with time slots from actual timetables and meals
    sortedTimeSlots.forEach(timeSlot => {
      grid[timeSlot] = {
        ...Object.fromEntries(DAYS_OF_WEEK.map(day => [day, null]))
      };
    });

    // Fill grid with actual timetables
    filteredTimetables.forEach(timetable => {
      const startTime = formatTime(timetable.startTime);
      const endTime = formatTime(timetable.endTime);
      const timeSlot = `${startTime}-${endTime}`;
      const dayOfWeek = convertDayOfWeek(timetable.dayOfWeek);
      
      console.log(`Placing timetable in grid: ${timetable.dayOfWeek} -> ${dayOfWeek} at ${timeSlot}`);
      console.log(`Timetable subjects:`, timetable.subjects?.map(s => s.name).join(', ') || 'No subjects');
      console.log(`Timetable teachers:`, timetable.teachers?.map(t => `${t.firstName} ${t.lastName}`).join(', ') || 'No teachers');
      
      if (grid[timeSlot]) {
        // Use the grouped timetable data directly (it already contains all subjects and teachers)
        grid[timeSlot][dayOfWeek] = timetable;
        console.log(`✅ Successfully placed timetable in grid slot: ${timeSlot} for ${dayOfWeek}`);
      } else {
        console.error(`❌ Time slot ${timeSlot} not found in grid for timetable:`, timetable);
      }
    });


    console.log('Final grid with timetables and meals:', grid);
    return grid;
  };

  const getSelectedClassName = () => {
    const selectedClassData = classes.find(c => c.id === selectedClass);
    return selectedClassData ? selectedClassData.name : 'All Classes';
  };


  const timetableGrid = generateTimetableGrid();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Timetable Management</h1>
          <p className="text-gray-600 mt-1">Manage class schedules and weekly timetables</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = '/admin/timetables/create'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Timetable
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={selectedBranch || ''}
              onChange={(e) => setSelectedBranch(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(e.target.value ? parseInt(e.target.value) : null)}
              disabled={!selectedBranch}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
            <select
              value={selectedAcademicYear || ''}
              onChange={(e) => setSelectedAcademicYear(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subjects, teachers, rooms..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show archived timetables</span>
            </label>
          </div>
          
        </div>
      </div>

      {/* Timetable Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : selectedClass ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Lesson schedule for class {getSelectedClassName()}
            </h2>
          </div>

          {/* Modern Responsive Timetable Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-800 border-r border-gray-200 w-8">#</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-800 border-r border-gray-200 w-20">Time</th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} className="px-2 py-2 text-center text-xs font-semibold text-gray-800 border-r border-gray-200 min-w-[120px]">
                      {day.substring(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(timetableGrid).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <BookOpen className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm font-medium mb-1">No timetables found</p>
                        <p className="text-xs">Create a new timetable or adjust your filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : Object.entries(timetableGrid)
                  .sort(([a], [b]) => {
                    const [aStart] = a.split('-');
                    const [bStart] = b.split('-');
                    return aStart.localeCompare(bStart);
                  })
                  .map(([timeSlot, daySlots], index) => (
                  <tr key={timeSlot} className="hover:bg-gray-25 transition-colors">
                    <td className="px-2 py-2 text-xs font-medium text-gray-700 border-r border-gray-100 text-center">
                      {index + 1}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-700 border-r border-gray-100">
                      <div className="font-semibold text-gray-800">{formatTime(timeSlot.split('-')[0])}</div>
                      <div className="text-[10px] text-gray-500">{formatTime(timeSlot.split('-')[1])}</div>
                    </td>
                    {DAYS_OF_WEEK.map(day => {
                      const timetable = daySlots[day];
                      
                      return (
                        <td key={day} className="px-1 py-2 border-r border-gray-100 min-h-[60px]">
                          {timetable ? (
                            <div className="p-2 rounded-md min-h-[55px] shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                              <div className="font-semibold text-gray-900 mb-1 text-center text-xs leading-tight">
                                {timetable.subjects && timetable.subjects.length > 0 
                                  ? timetable.subjects.map(s => s.name).join(' | ')
                                  : 'No subjects'}
                              </div>
                              {(
                                <>
                                  <div className="text-[10px] text-gray-600 mb-1 text-center">
                                    {timetable.teachers && timetable.teachers.length > 0 
                                      ? timetable.teachers.map(t => `${t.firstName} ${t.lastName}`).join(' | ')
                                      : 'No teacher assigned'}
                                  </div>
                                  {(timetable.roomNumber || timetable.buildingName) && (
                                    <div className="text-[10px] text-gray-500 mb-1 text-center">
                                      {timetable.roomNumber && `R: ${timetable.roomNumber}`}
                                      {timetable.buildingName && ` (${timetable.buildingName})`}
                                    </div>
                                  )}
                                  <div className="flex items-center justify-center gap-1 mt-1">
                                    <button
                                      onClick={() => handleEdit(timetable)}
                                      className="p-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                                      title="Edit"
                                    >
                                      <Edit className="w-2.5 h-2.5" />
                                    </button>
                                    {timetable.isActive ? (
                                      <button
                                        onClick={() => handleArchive(timetable.id)}
                                        className="p-0.5 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded transition-colors"
                                        title="Archive"
                                      >
                                        <Archive className="w-2.5 h-2.5" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleRestore(timetable.id)}
                                        className="p-0.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                        title="Restore"
                                      >
                                        <RotateCcw className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDelete(timetable.id)}
                                      className="p-0.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="h-[55px] flex items-center justify-center bg-gray-25 rounded-md border border-gray-150 hover:bg-gray-50 transition-colors">
                              <span className="text-[10px] text-gray-400">No lesson</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Class</h3>
          <p className="text-gray-600">Choose a branch and class to view their timetable</p>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Timetable</h3>
            
            <div className="space-y-6">
              {/* Time Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({...editFormData, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editFormData.endTime}
                    onChange={(e) => setEditFormData({...editFormData, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Subject Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Subjects
                </label>
                
                {/* Selected Subjects Display */}
                {editFormData.subjectIds && editFormData.subjectIds.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 font-medium">Selected Subjects:</div>
                    <div className="flex flex-wrap gap-2">
                      {editFormData.subjectIds.map(subjectId => {
                        const subject = subjects.find(s => s.id === subjectId);
                        return (
                          <div
                            key={subjectId}
                            className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{subject?.name}</span>
                            <button
                              onClick={() => {
                                const newSubjectIds = editFormData.subjectIds.filter(id => id !== subjectId);
                                setEditFormData({...editFormData, subjectIds: newSubjectIds});
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors hover:bg-blue-200 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Subject Selection Grid */}
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                  {subjects.map(subject => {
                    const isSelected = editFormData.subjectIds?.includes(subject.id) || false;
                    return (
                      <div key={subject.id} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                        <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                        <button
                          onClick={() => handleEditSubjectSelection(subject.id)}
                          className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                            isSelected
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                          }`}
                        >
                          {isSelected ? (
                            <> ✓ Added </>
                          ) : (
                            <> + Add </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Teacher Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Teachers
                </label>
                
                {/* Selected Teachers Display */}
                {editFormData.teacherIds && editFormData.teacherIds.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 font-medium">Selected Teachers:</div>
                    <div className="flex flex-wrap gap-2">
                      {editFormData.teacherIds.map(teacherId => {
                        const teacher = teachers.find(t => t.id === teacherId);
                        return (
                          <div
                            key={teacherId}
                            className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{teacher ? `${teacher.firstName} ${teacher.lastName}` : `Teacher ${teacherId}`}</span>
                            <button
                              onClick={() => {
                                const newTeacherIds = editFormData.teacherIds.filter(id => id !== teacherId);
                                setEditFormData({...editFormData, teacherIds: newTeacherIds});
                              }}
                              className="text-green-600 hover:text-green-800 transition-colors hover:bg-green-200 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Teacher Selection Grid */}
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                  {loadingEditTeachers ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm">Loading teachers...</p>
                    </div>
                  ) : filteredEditTeachers.length > 0 ? (
                    filteredEditTeachers.map(teacher => {
                      const isSelected = editFormData.teacherIds?.includes(teacher.id) || false;
                      return (
                        <div key={teacher.id} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${isSelected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700">{teacher.firstName} {teacher.lastName}</span>
                            <span className="text-xs text-gray-500">ID: {teacher.teacherId}</span>
                          </div>
                          <button
                            onClick={() => {
                              const currentIds = editFormData.teacherIds || [];
                              if (isSelected) {
                                const newIds = currentIds.filter(id => id !== teacher.id);
                                setEditFormData({...editFormData, teacherIds: newIds});
                              } else {
                                const newIds = [...currentIds, teacher.id];
                                setEditFormData({...editFormData, teacherIds: newIds});
                              }
                            }}
                            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                              isSelected
                                ? 'bg-green-100 text-green-700'
                                : 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md'
                            }`}
                          >
                            {isSelected ? (
                              <> ✓ Added </>
                            ) : (
                              <> + Add </>
                            )}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {editFormData.subjectIds.length === 0
                          ? "Please select subjects first"
                          : "No teachers assigned to selected subjects"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTimetable}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManagementPage;
