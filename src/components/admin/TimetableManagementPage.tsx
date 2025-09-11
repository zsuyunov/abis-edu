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
  dayOfWeek: string;
  subjectId: number | null;
  teacherIds: string[];
  startTime: string;
  endTime: string;
  roomNumber: string | null;
  buildingName: string | null;
  isElective: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch: Branch;
  class: Class;
  academicYear: AcademicYear;
  subject: Subject | null;
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
  const [bellTimes, setBellTimes] = useState<any[]>([]);
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
    teacherIds: [] as string[]
  });

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
    fetchBellTimes();
    fetchSubjects();
    fetchTeachers();
  }, [selectedBranch, selectedClass, selectedAcademicYear, showInactive]);

  useEffect(() => {
    applyFilters();
  }, [timetables, searchTerm, showInactive]);

  const fetchInitialData = async () => {
    try {
      const [branchesRes, academicYearsRes] = await Promise.all([
        fetch('/api/branches'),
        fetch('/api/academic-years')
      ]);

      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        setBranches(Array.isArray(branchesData) ? branchesData : []);
        // Auto-select the first branch (SuzukOta) to match saved timetables
        if (branchesData.length > 0) {
          const suzukOtaBranch = branchesData.find((b: Branch) => b.shortName === 'SuzukOta') || branchesData[0];
          setSelectedBranch(suzukOtaBranch.id);
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
      const response = await fetch(`/api/admin/timetables?${params}`);
      console.log('Timetables response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Timetables data received:', data);
        setTimetables(Array.isArray(data) ? data : []);
      } else {
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

  const fetchBellTimes = async () => {
    try {
      // Determine year range based on selected class
      const yearRange = '7-13'; // Default, could be dynamic based on class
      const response = await fetch(`/api/admin/bell-times?yearRange=${yearRange}`);
      
      if (response.ok) {
        const data = await response.json();
        setBellTimes(Array.isArray(data) ? data : []);
      } else {
        setBellTimes([]);
      }
    } catch (error) {
      console.error('Error fetching bell times:', error);
      setBellTimes([]);
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
  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds if present
  };

  const getSubjectName = (subjectId: number | null) => {
    if (!subjectId) return 'No subject';
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : `Subject ${subjectId}`;
  };

  const getTeacherNames = (teacherIds: string[]) => {
    if (!teacherIds || teacherIds.length === 0) return 'No teacher assigned';
    return teacherIds.map(id => {
      const teacher = teachers.find(t => t.id === id);
      return teacher ? `${teacher.firstName} ${teacher.lastName}` : `Teacher ${id}`;
    }).join(', ');
  };

  const handleEdit = (timetable: any) => {
    setEditingTimetable(timetable);
    setEditFormData({
      startTime: timetable.startTime,
      endTime: timetable.endTime,
      subjectId: timetable.subjectId.toString(),
      teacherIds: timetable.teacherIds || []
    });
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
      if (editFormData.subjectId !== editingTimetable.subjectId.toString()) {
        updateData.subjectId = parseInt(editFormData.subjectId);
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
        setSuccess('Timetable updated successfully');
        setEditModalOpen(false);
        fetchTimetables();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to update timetable');
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
    if (!confirm('Are you sure you want to delete this timetable? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/timetables/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Timetable deleted successfully');
        fetchTimetables();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to delete timetable');
      }
    } catch (error) {
      console.error('Error deleting timetable:', error);
      setError('Failed to delete timetable');
      setTimeout(() => setError(null), 3000);
    }
  };

  const generateTimetableGrid = (): TimetableGrid => {
    const grid: TimetableGrid = {};
    
    console.log('Generating timetable grid with filteredTimetables:', filteredTimetables);
    console.log('Using bell times:', bellTimes);
    
    // Get all bell times (lessons and breaks) and sort by start time
    const allBellTimes = bellTimes.length > 0 ? bellTimes : [
      { startTime: '07:30', endTime: '07:55', eventName: 'Breakfast', isBreak: true },
      { startTime: '08:00', endTime: '08:45', eventName: 'Lesson 1', isBreak: false },
      { startTime: '08:50', endTime: '09:35', eventName: 'Lesson 2', isBreak: false },
      { startTime: '09:40', endTime: '09:55', eventName: 'Snack Time', isBreak: true },
      { startTime: '10:00', endTime: '10:45', eventName: 'Lesson 3', isBreak: false },
      { startTime: '10:50', endTime: '11:35', eventName: 'Lesson 4', isBreak: false },
      { startTime: '11:40', endTime: '12:00', eventName: 'Rest Time', isBreak: true },
      { startTime: '12:05', endTime: '12:50', eventName: 'Lunch', isBreak: true },
      { startTime: '12:55', endTime: '13:40', eventName: 'Lesson 5', isBreak: false },
      { startTime: '13:45', endTime: '14:30', eventName: 'Lesson 6', isBreak: false }
    ];

    // Sort bell times by start time to ensure correct order
    const sortedBellTimes = allBellTimes.sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });

    // Add any custom timetable time slots that don't match bell times
    const customTimeSlots = new Set<string>();
    filteredTimetables.forEach(timetable => {
      const timeSlot = `${timetable.startTime}-${timetable.endTime}`;
      const matchesBellTime = sortedBellTimes.some(bt => 
        `${bt.startTime.substring(0, 5)}-${bt.endTime.substring(0, 5)}` === timeSlot
      );
      if (!matchesBellTime) {
        customTimeSlots.add(timeSlot);
      }
    });

    // Initialize grid with bell time slots
    sortedBellTimes.forEach(bellTime => {
      const timeSlot = `${bellTime.startTime.substring(0, 5)}-${bellTime.endTime.substring(0, 5)}`;
      grid[timeSlot] = {
        bellTime: bellTime, // Store bell time info for break display
        ...Object.fromEntries(DAYS_OF_WEEK.map(day => [day, null]))
      };
    });

    // Add custom time slots to grid
    Array.from(customTimeSlots).sort().forEach(timeSlot => {
      if (!grid[timeSlot]) {
        grid[timeSlot] = {};
        DAYS_OF_WEEK.forEach(day => {
          grid[timeSlot][day] = null;
        });
      }
    });

    // Fill grid with actual timetables
    filteredTimetables.forEach(timetable => {
      const timeSlot = `${timetable.startTime}-${timetable.endTime}`;
      console.log(`Placing timetable in grid: ${timetable.dayOfWeek} at ${timeSlot}`);
      if (grid[timeSlot]) {
        grid[timeSlot][timetable.dayOfWeek] = timetable;
      } else {
        console.warn(`Time slot ${timeSlot} not found in grid for timetable:`, timetable);
      }
    });

    console.log('Final grid with bell times:', grid);
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
          <button 
            onClick={() => window.location.href = '/admin/timetables/bell-times'}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Bell Times
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
                ) : Object.entries(timetableGrid).map(([timeSlot, daySlots], index) => (
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
                      const bellTime = (daySlots as any).bellTime;
                      
                      return (
                        <td key={day} className="px-1 py-2 border-r border-gray-100 min-h-[60px]">
                          {timetable ? (
                            <div className="p-2 rounded-md bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 min-h-[55px] shadow-sm hover:shadow-md transition-shadow">
                              <div className="font-semibold text-gray-900 mb-1 text-center text-xs leading-tight">
                                {getSubjectName(timetable.subjectId)}
                              </div>
                              <div className="text-[10px] text-gray-600 mb-1 text-center">
                                {getTeacherNames(timetable.teacherIds)}
                              </div>
                              {(timetable.roomNumber || timetable.buildingName) && (
                                <div className="text-[10px] text-gray-500 mb-1 text-center">
                                  {timetable.roomNumber && `R: ${timetable.roomNumber}`}
                                  {timetable.buildingName && ` (${timetable.buildingName})`}
                                </div>
                              )}
                              {timetable.isElective && (
                                <div className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded text-center mb-1">
                                  Elective
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
                            </div>
                          ) : bellTime && bellTime.isBreak ? (
                            <div className="h-[55px] flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-md shadow-sm">
                              <div className="text-center">
                                <div className="font-semibold text-orange-800 text-xs mb-1">
                                  {bellTime.eventName}
                                </div>
                                {bellTime.notes && (
                                  <div className="text-[9px] text-orange-600">
                                    {bellTime.notes}
                                  </div>
                                )}
                              </div>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Timetable</h3>
            
            <div className="space-y-4">
              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time (optional)
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
                  End Time (optional)
                </label>
                <input
                  type="time"
                  value={editFormData.endTime}
                  onChange={(e) => setEditFormData({...editFormData, endTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject (optional)
                </label>
                <select
                  value={editFormData.subjectId}
                  onChange={(e) => setEditFormData({...editFormData, subjectId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teachers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teachers (optional)
                </label>
                <select
                  multiple
                  value={editFormData.teacherIds}
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                    setEditFormData({...editFormData, teacherIds: selectedIds});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                >
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple teachers</p>
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
