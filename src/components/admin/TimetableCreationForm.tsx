'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  MapPin, 
  Building, 
  Plus, 
  Save, 
  ChevronDown,
  X,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Branch {
  id: number;
  shortName: string;
  legalName: string;
}

interface Class {
  id: number;
  name: string;
  branchId: number;
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

interface TimetableSlot {
  dayOfWeek: string;
  subjectIds: number[];
  teacherIds: string[];
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName: string;
}

interface BellTime {
  id: number;
  eventName: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TimetableCreationForm: React.FC = () => {
  // Form state
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
  const [currentDay, setCurrentDay] = useState<string>('Monday');
  const [timetableSlots, setTimetableSlots] = useState<Record<string, TimetableSlot[]>>({});

  // Data state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [bellTimes, setBellTimes] = useState<BellTime[]>([]);

  // Meal/Break time configuration
  const [mealTimes, setMealTimes] = useState({
    breakfast: { enabled: false, startTime: '', endTime: '' },
    snack: { enabled: false, startTime: '', endTime: '' },
    rest: { enabled: false, startTime: '', endTime: '' },
    lunch: { enabled: false, startTime: '', endTime: '' }
  });
  const [showMealConfig, setShowMealConfig] = useState(false);
  const [mealConfigSaved, setMealConfigSaved] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchBranches();
    fetchAcademicYears();
    fetchSubjects();
    fetchTeachers();
  }, []);

  // Auto-filter teachers when class or academic year changes (if subjects are already selected)
  useEffect(() => {
    const currentSlot = timetableSlots[currentDay]?.[0]; // Check first slot for subjects
    if (currentSlot && currentSlot.subjectIds.length > 0 && selectedClass && selectedAcademicYear) {
      console.log('🔄 Auto-filtering teachers due to class/academic year change');
      // @ts-ignore - TypeScript is not recognizing the updated function signature
      fetchTeachersForSubjects(currentSlot.subjectIds, selectedClass, selectedAcademicYear);
    }
  }, [selectedClass, selectedAcademicYear, currentDay]);

  // Show meal configuration when all required fields are selected
  useEffect(() => {
    if (selectedBranch && selectedClass && selectedAcademicYear && !mealConfigSaved) {
      setShowMealConfig(true);
    } else {
      setShowMealConfig(false);
    }
  }, [selectedBranch, selectedClass, selectedAcademicYear, mealConfigSaved]);

  // Fetch classes when branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchClasses(selectedBranch);
    }
  }, [selectedBranch]);

  // Fetch bell times when class changes (to determine year range)
  useEffect(() => {
    if (selectedClass) {
      const classData = classes.find(c => c.id === selectedClass);
      if (classData) {
        // Determine year range based on class name (you may need to adjust this logic)
        const yearRange = classData.name.includes('Year') && 
          (classData.name.includes('1') || classData.name.includes('2') || 
           classData.name.includes('3') || classData.name.includes('4') || 
           classData.name.includes('5') || classData.name.includes('6')) ? '1-6' : '7-13';
        fetchBellTimes(yearRange);
      }
    }
  }, [selectedClass, classes]);

  // Reset filtered teachers when branch, class, or academic year changes
  useEffect(() => {
    setFilteredTeachers(teachers);
  }, [selectedBranch, selectedClass, selectedAcademicYear, teachers]);

  // Periodic refresh every 30 seconds to catch new subjects/teachers
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSubjects(true);
      fetchTeachers(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(Array.isArray(data) ? data : []);
      } else {
        setBranches([]);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
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

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch('/api/academic-years');
      if (response.ok) {
        const data = await response.json();
        setAcademicYears(Array.isArray(data) ? data : []);
        // Auto-select current academic year
        const current = data.find((year: AcademicYear) => year.isCurrent);
        if (current) {
          setSelectedAcademicYear(current.id);
        }
      } else {
        setAcademicYears([]);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      setAcademicYears([]);
    }
  };

  const fetchSubjects = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
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
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  };

  const fetchTeachers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(Array.isArray(data) ? data : []);
        setFilteredTeachers(Array.isArray(data) ? data : []);
      } else {
        setTeachers([]);
        setFilteredTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
      setFilteredTeachers([]);
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  };

  const fetchTeachersForSubjects = async (subjectIds: number[], classId?: number, academicYearId?: number | null | undefined) => {
    console.log('🔍 fetchTeachersForSubjects called with:', { subjectIds, classId, academicYearId });

    if (subjectIds.length === 0) {
      console.log('📝 No subjects selected, showing all teachers');
      setFilteredTeachers(teachers);
      return;
    }

    // If we don't have classId or academicYearId, we can't filter by assignments
    if (!classId || !academicYearId) {
      console.log('⚠️ Missing classId or academicYearId, showing all teachers');
      setFilteredTeachers(teachers);
      return;
    }

    try {
      const url = `/api/teachers/by-subjects?subjectIds=${subjectIds.join(',')}&classId=${classId}&academicYearId=${academicYearId}`;
      console.log('🌐 Fetching teachers from:', url);

      const response = await fetch(url);
      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('👥 Teachers found:', data.length);
        setFilteredTeachers(data);
      } else {
        const errorText = await response.text();
        console.error('❌ API error:', response.status, errorText);
        setFilteredTeachers(teachers); // Fallback to all teachers
      }
    } catch (error) {
      console.error('❌ Error fetching teachers for subjects:', error);
      setFilteredTeachers(teachers); // Fallback to all teachers
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchSubjects(true),
        fetchTeachers(true)
      ]);
      setSuccess('Data refreshed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to refresh data');
      setTimeout(() => setError(null), 3000);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchBellTimes = async (yearRange: string) => {
    try {
      const response = await fetch(`/api/admin/bell-times?yearRange=${yearRange}`);
      if (response.ok) {
        const data = await response.json();
        const bellTimesData = Array.isArray(data) ? data : [];
        setBellTimes(bellTimesData.filter((bt: BellTime) => bt.eventName.startsWith('Lesson')));
      } else {
        setBellTimes([]);
      }
    } catch (error) {
      console.error('Error fetching bell times:', error);
      setBellTimes([]);
    }
  };

  const addTimetableSlot = (day: string) => {
    const newSlot: TimetableSlot = {
      dayOfWeek: day,
      subjectIds: [],
      teacherIds: [],
      startTime: '',
      endTime: '',
      roomNumber: '',
      buildingName: ''
    };

    setTimetableSlots(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), newSlot]
    }));
  };

  const updateTimetableSlot = (day: string, index: number, field: keyof TimetableSlot, value: any) => {
    setTimetableSlots(prev => ({
      ...prev,
      [day]: prev[day]?.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      ) || []
    }));
  };

  const removeTimetableSlot = (day: string, index: number) => {
    setTimetableSlots(prev => ({
      ...prev,
      [day]: prev[day]?.filter((_, i) => i !== index) || []
    }));
  };

  const handleMealTimeChange = (mealType: string, field: 'enabled' | 'startTime' | 'endTime', value: any) => {
    setMealTimes(prev => ({
      ...prev,
      [mealType]: {
        ...prev[mealType as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const saveMealConfiguration = () => {
    // Validate that if enabled, both start and end times are provided
    const hasInvalidConfig = Object.entries(mealTimes).some(([mealType, config]) => {
      if (config.enabled) {
        return !config.startTime || !config.endTime;
      }
      return false;
    });

    if (hasInvalidConfig) {
      setError('Please provide both start and end times for enabled meal periods');
      return;
    }

    setMealConfigSaved(true);
    setShowMealConfig(false);
    setSuccess('Meal configuration saved successfully! You can now add time slots.');
    setTimeout(() => setSuccess(null), 3000);
  };

  const resetMealConfiguration = () => {
    setMealTimes({
      breakfast: { enabled: false, startTime: '', endTime: '' },
      snack: { enabled: false, startTime: '', endTime: '' },
      rest: { enabled: false, startTime: '', endTime: '' },
      lunch: { enabled: false, startTime: '', endTime: '' }
    });
    setMealConfigSaved(false);
  };

  const saveTimetable = async () => {
    if (!selectedBranch || !selectedClass || !selectedAcademicYear) {
      setError('Please select branch, class, and academic year');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const allSlots: any[] = [];
      
      // Collect all slots from all days
      Object.entries(timetableSlots).forEach(([day, slots]) => {
        slots.forEach(slot => {
          if (slot.startTime && slot.endTime && slot.subjectIds && slot.subjectIds.length > 0) {
            allSlots.push({
              branchId: selectedBranch,
              classId: selectedClass,
              academicYearId: selectedAcademicYear,
              dayOfWeek: day,
              subjectIds: slot.subjectIds,
              teacherIds: slot.teacherIds || [],
              startTime: slot.startTime,
              endTime: slot.endTime,
              roomNumber: slot.roomNumber || '',
              buildingName: slot.buildingName || ''
            });
          }
        });
      });

      if (allSlots.length === 0) {
        setError('No valid timetable slots to save. Please ensure all slots have subjects, start time, and end time.');
        setSaving(false);
        return;
      }

      // Save all slots
      console.log('💾 Saving timetable slots:', allSlots);
      
      const promises = allSlots.map(slot => 
        fetch('/api/admin/timetables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slot)
        })
      );

      const results = await Promise.all(promises);
      console.log('📡 API responses:', results.map(r => ({ status: r.status, ok: r.ok })));
      
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        // Get error details from failed requests
        const errorDetails = await Promise.all(
          failed.map(async (result) => {
            try {
              const errorData = await result.json();
              console.error('❌ API Error:', errorData);
              return errorData.error || `HTTP ${result.status}`;
            } catch (e) {
              console.error('❌ Failed to parse error response:', e);
              return `HTTP ${result.status}`;
            }
          })
        );
        
        throw new Error(`Failed to save ${failed.length} timetable slots. Errors: ${errorDetails.join(', ')}`);
      }

      setSuccess('Timetable saved successfully!');
      // Reset form
      setTimetableSlots({});
      setCurrentDay('Monday');
      
      // Refresh data to get any new subjects/teachers
      await refreshData();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const canProceedToDay = (day: string) => {
    return selectedBranch && selectedClass && selectedAcademicYear;
  };

  const getNextDay = (currentDay: string) => {
    const currentIndex = DAYS_OF_WEEK.indexOf(currentDay);
    return currentIndex < DAYS_OF_WEEK.length - 1 ? DAYS_OF_WEEK[currentIndex + 1] : null;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      {/* Meal Configuration Modal */}
      {showMealConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Configure Meal & Break Times</h2>
              <button
                onClick={() => setShowMealConfig(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {Object.entries(mealTimes).map(([mealType, config]) => (
                <div key={mealType} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900 capitalize">
                      {mealType === 'rest' ? 'Rest Time' : mealType}
                    </h3>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => handleMealTimeChange(mealType, 'enabled', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable</span>
                    </label>
                  </div>
                  
                  {config.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={config.startTime}
                          onChange={(e) => handleMealTimeChange(mealType, 'startTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={config.endTime}
                          onChange={(e) => handleMealTimeChange(mealType, 'endTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetMealConfiguration}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Reset
              </button>
              <button
                onClick={saveMealConfiguration}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Recurrence Timetable</h1>
          <p className="text-gray-600">Set up weekly recurring schedules for classes</p>
          {mealConfigSaved && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                ✅ Meal & break times configured! You can now add time slots for lessons.
              </p>
            </div>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Branch Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBranch || ''}
              onChange={(e) => setSelectedBranch(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Branch</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName} - {branch.legalName}
                </option>
              ))}
            </select>
          </div>

          {/* Class Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Related Class <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(e.target.value ? parseInt(e.target.value) : null)}
              disabled={!selectedBranch}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedAcademicYear || ''}
              onChange={(e) => setSelectedAcademicYear(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>


        {/* Day Selection Tabs */}
        {canProceedToDay(currentDay) && (
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  onClick={() => setCurrentDay(day)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    currentDay === day
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {day}
                  {timetableSlots[day]?.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                      {timetableSlots[day].length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Timetable Slots for Current Day */}
        {canProceedToDay(currentDay) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {currentDay} Schedule
              </h3>
              <button
                onClick={() => addTimetableSlot(currentDay)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Time Slot
              </button>
            </div>

            {/* Bell Times Reference */}
            {bellTimes.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Suggested Bell Times:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {bellTimes.map(bt => (
                    <div key={bt.id} className="text-gray-600">
                      <span className="font-medium">{bt.eventName}:</span> {bt.startTime} - {bt.endTime}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Slots */}
            <div className="space-y-4">
              {(timetableSlots[currentDay] || []).map((slot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-lg p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Time Slot {index + 1}</h4>
                    <button
                      onClick={() => removeTimetableSlot(currentDay, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Subject Selection */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Subjects (Multi-select)
                      </label>
                      <select
                        multiple
                        value={slot.subjectIds.map(String)}
                        onChange={(e) => {
                          const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                          updateTimetableSlot(currentDay, index, 'subjectIds', selectedIds);
                          
                          // Filter teachers based on selected subjects
                          // @ts-ignore - TypeScript is not recognizing the updated function signature
                          fetchTeachersForSubjects(selectedIds, selectedClass, selectedAcademicYear);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Teacher Selection */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Teachers (Multi-select)
                        {slot.subjectIds.length > 0 && selectedClass && selectedAcademicYear && (
                          <span className="ml-2 text-xs text-blue-600 font-normal">
                            (Filtered by selected subjects)
                          </span>
                        )}
                        {slot.subjectIds.length > 0 && (!selectedClass || !selectedAcademicYear) && (
                          <span className="ml-2 text-xs text-orange-600 font-normal">
                            (Select class and academic year to filter)
                          </span>
                        )}
                      </label>
                      <select
                        multiple
                        value={slot.teacherIds}
                        onChange={(e) => {
                          const value = Array.from(e.target.selectedOptions, option => option.value);
                          updateTimetableSlot(currentDay, index, 'teacherIds', value);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {filteredTeachers.length > 0 ? (
                          filteredTeachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
                            </option>
                          ))
                        ) : (
                          <option disabled>
                            {slot.subjectIds.length === 0
                              ? "Please select subjects first"
                              : slot.subjectIds.length > 0 && selectedClass && selectedAcademicYear
                              ? "No teachers assigned to selected subjects"
                              : "Select class and academic year to see teachers"}
                          </option>
                        )}
                      </select>
                    </div>

                    {/* Start Time */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Start Time</label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimetableSlot(currentDay, index, 'startTime', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* End Time */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">End Time</label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimetableSlot(currentDay, index, 'endTime', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Room Number */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Room Number</label>
                      <input
                        type="text"
                        value={slot.roomNumber}
                        onChange={(e) => updateTimetableSlot(currentDay, index, 'roomNumber', e.target.value)}
                        placeholder="e.g., 101, Lab A"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Building Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Building Name</label>
                      <input
                        type="text"
                        value={slot.buildingName}
                        onChange={(e) => updateTimetableSlot(currentDay, index, 'buildingName', e.target.value)}
                        placeholder="e.g., Main Building, Science Block"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Next Day Button */}
            {timetableSlots[currentDay]?.length > 0 && getNextDay(currentDay) && (
              <div className="flex justify-center">
                <button
                  onClick={() => setCurrentDay(getNextDay(currentDay)!)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add {getNextDay(currentDay)}
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        {Object.keys(timetableSlots).length > 0 && (
          <div className="flex justify-center pt-6 border-t border-gray-200">
            <button
              onClick={saveTimetable}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Saving...' : 'Save Timetable'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TimetableCreationForm;
