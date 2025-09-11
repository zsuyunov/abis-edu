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
  AlertCircle
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
  subjectId: number | null;
  subjectIds: number[];
  teacherIds: string[];
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName: string;
  isElective: boolean;
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
  const [enableElectives, setEnableElectives] = useState(false);
  const [currentDay, setCurrentDay] = useState<string>('Monday');
  const [timetableSlots, setTimetableSlots] = useState<Record<string, TimetableSlot[]>>({});

  // Data state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [bellTimes, setBellTimes] = useState<BellTime[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchBranches();
    fetchAcademicYears();
    fetchSubjects();
    fetchTeachers();
  }, []);

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
      subjectId: null,
      subjectIds: [],
      teacherIds: [],
      startTime: '',
      endTime: '',
      roomNumber: '',
      buildingName: '',
      isElective: enableElectives
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
          if (slot.startTime && slot.endTime) {
            allSlots.push({
              branchId: selectedBranch,
              classId: selectedClass,
              academicYearId: selectedAcademicYear,
              dayOfWeek: day,
              subjectId: slot.subjectId,
              teacherIds: slot.teacherIds,
              startTime: slot.startTime,
              endTime: slot.endTime,
              roomNumber: slot.roomNumber,
              buildingName: slot.buildingName,
              isElective: slot.isElective
            });
          }
        });
      });

      // Save all slots
      const promises = allSlots.map(slot => 
        fetch('/api/admin/timetables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slot)
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to save ${failed.length} timetable slots`);
      }

      setSuccess('Timetable saved successfully!');
      // Reset form
      setTimetableSlots({});
      setCurrentDay('Monday');
      
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Recurrence Timetable</h1>
          <p className="text-gray-600">Set up weekly recurring schedules for classes</p>
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

        {/* Enable Electives Checkbox */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="enableElectives"
            checked={enableElectives}
            onChange={(e) => setEnableElectives(e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="enableElectives" className="text-sm font-medium text-gray-700">
            Enable Elective Subjects (allows multiple subjects and teachers per time slot)
          </label>
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
                        Subject {enableElectives ? '(Multi-select)' : ''}
                      </label>
                      <select
                        multiple={enableElectives}
                        value={enableElectives ? slot.subjectIds.map(String) : (slot.subjectId ? String(slot.subjectId) : '')}
                        onChange={(e) => {
                          if (enableElectives) {
                            const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                            updateTimetableSlot(currentDay, index, 'subjectIds', selectedIds);
                          } else {
                            const value = e.target.value ? parseInt(e.target.value) : null;
                            updateTimetableSlot(currentDay, index, 'subjectId', value);
                          }
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Subject</option>
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
                        Teacher(s) {enableElectives ? '(Multi-select)' : ''}
                      </label>
                      <select
                        multiple={enableElectives}
                        value={enableElectives ? slot.teacherIds : (slot.teacherIds[0] || '')}
                        onChange={(e) => {
                          const value = enableElectives 
                            ? Array.from(e.target.selectedOptions, option => option.value)
                            : [e.target.value];
                          updateTimetableSlot(currentDay, index, 'teacherIds', value);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
                          </option>
                        ))}
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
