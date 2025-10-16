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
  RefreshCw,
  UserCheck,
  BookCheck
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

interface SubjectTeacherPair {
  subjectId: number;
  teacherIds: string[];
}

interface TimetableSlot {
  dayOfWeek: string;
  subjectIds: number[];
  teacherIds: string[];
  subjectTeacherPairs: SubjectTeacherPair[];  // New structured format
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
  
  // Confirmation state for selections
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [showSubjectConfirmation, setShowSubjectConfirmation] = useState(false);
  const [showTeacherConfirmation, setShowTeacherConfirmation] = useState(false);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessingSubject, setIsProcessingSubject] = useState<number | null>(null);

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
        console.log('Subjects fetched:', data);
        if (Array.isArray(data) && data.length === 0) {
          console.warn('No subjects found in database. Please add subjects first.');
        }
        setSubjects(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch subjects. Status:', response.status);
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

    if (subjectIds.length === 0) {
      setFilteredTeachers(teachers);
      return;
    }

    // If we don't have classId or academicYearId, we can't filter by assignments
    if (!classId || !academicYearId) {
      setFilteredTeachers(teachers);
      return;
    }

    try {
      const url = `/api/teachers/by-subjects?subjectIds=${subjectIds.join(',')}&classId=${classId}&academicYearId=${academicYearId}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        
        if (data.length === 0) {
          // Check if any of the subjects have no assigned teachers
          const unassignedSubjects = await checkUnassignedSubjects(subjectIds, classId, academicYearId);
          if (unassignedSubjects.length > 0) {
            setError(`No teachers assigned to subjects: ${unassignedSubjects.map(s => s.name).join(', ')}. Please assign teachers to these subjects first.`);
            setTimeout(() => setError(null), 5000);
          }
        }
        
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

  const checkUnassignedSubjects = async (subjectIds: number[], classId: number, academicYearId: number) => {
    try {
      const unassignedSubjects = [];
      
      for (const subjectId of subjectIds) {
        const assignments = await fetch(`/api/teachers/by-subjects?subjectIds=${subjectId}&classId=${classId}&academicYearId=${academicYearId}`);
        if (assignments.ok) {
          const teachers = await assignments.json();
          if (teachers.length === 0) {
            const subject = subjects.find(s => s.id === subjectId);
            if (subject) {
              unassignedSubjects.push(subject);
            }
          }
        }
      }
      
      return unassignedSubjects;
    } catch (error) {
      console.error('Error checking unassigned subjects:', error);
      return [];
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
      subjectTeacherPairs: [],
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

  const handleSubjectSelection = (day: string, index: number, selectedIds: number[]) => {
    setSelectedSubjects(selectedIds);
    setCurrentSlotIndex(index);
    setShowSubjectConfirmation(true);
  };

  const handleIndividualSubjectSelection = async (day: string, index: number, subjectId: number) => {
    setCurrentSlotIndex(index);
    
    // Prevent multiple simultaneous requests for the same subject
    if (isProcessingSubject === subjectId) {
      return;
    }
    
    // Check if this subject has assigned teachers
    if (selectedClass && selectedAcademicYear) {
      try {
        // Show loading state immediately
        setIsProcessingSubject(subjectId);
        
        const response = await fetch(`/api/teachers/by-subjects?subjectIds=${subjectId}&classId=${selectedClass}&academicYearId=${selectedAcademicYear}`);
        if (response.ok) {
          const teachers = await response.json();
          
          if (teachers.length === 0) {
            // Show error modal for unassigned subject
            const subject = subjects.find(s => s.id === subjectId);
            setErrorMessage(`No teachers assigned to "${subject?.name || 'this subject'}" for this class. Please assign a teacher to this subject first.`);
            setShowErrorModal(true);
            setIsProcessingSubject(null);
            return;
          }
          
          // Add subject WITHOUT auto-assigning teachers
          const currentSlot = timetableSlots[day]?.[index];
          
          // Build subject-teacher pair with EMPTY teachers array
          const newPair: SubjectTeacherPair = { 
            subjectId, 
            teacherIds: []  // Empty - teachers will be added manually
          };
          const newPairs = [...(currentSlot?.subjectTeacherPairs || []), newPair];
          
          // Also update old structure for UI compatibility
          const newSubjectIds = [...(currentSlot?.subjectIds || []), subjectId];
          
          // Update both structures
          const updatedSlots = timetableSlots[day]?.map((slot, i) => 
            i === index ? { 
              ...slot, 
              subjectIds: newSubjectIds,
              subjectTeacherPairs: newPairs
            } : slot
          ) || [];
          
          setTimetableSlots(prev => ({
            ...prev,
            [day]: updatedSlots
          }));
          
          // Update filtered teachers to show available teachers for this subject
          setFilteredTeachers(teachers);
          
          const subject = subjects.find(s => s.id === subjectId);
          setSuccess(`Subject "${subject?.name}" added! Now select teacher(s) from the list.`);
          setTimeout(() => setSuccess(null), 3000);
        }
      } catch (error) {
        console.error('Error checking subject assignment:', error);
        setError('Failed to check subject assignment');
        setTimeout(() => setError(null), 3000);
      } finally {
        setIsProcessingSubject(null);
      }
    } else {
      setError('Please select class and academic year first');
      setTimeout(() => setError(null), 3000);
    }
  };

  const confirmSubjectSelection = (day: string, index: number) => {
    updateTimetableSlot(day, index, 'subjectIds', selectedSubjects);
    
    // Filter teachers based on selected subjects
    fetchTeachersForSubjects(selectedSubjects, selectedClass || undefined, selectedAcademicYear || undefined);
    
    setShowSubjectConfirmation(false);
    setSelectedSubjects([]);
    setCurrentSlotIndex(null);
  };

  const cancelSubjectSelection = () => {
    setShowSubjectConfirmation(false);
    setSelectedSubjects([]);
    setCurrentSlotIndex(null);
  };

  const handleTeacherSelection = (day: string, index: number, selectedIds: string[]) => {
    setSelectedTeachers(selectedIds);
    setCurrentSlotIndex(index);
    setShowTeacherConfirmation(true);
  };

  const handleIndividualTeacherSelection = (day: string, index: number, teacherId: string) => {
    setCurrentSlotIndex(index);
    
    const currentSlot = timetableSlots[day]?.[index];
    const teacher = filteredTeachers.find(t => t.id === teacherId);
    
    // Find the last added subject (most recent) to assign this teacher to
    const lastSubjectPair = currentSlot?.subjectTeacherPairs?.[currentSlot.subjectTeacherPairs.length - 1];
    
    if (!lastSubjectPair) {
      setError('Please add a subject first before adding teachers');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Add teacher to the last subject's teacherIds
    const updatedPairs = currentSlot.subjectTeacherPairs.map((pair, idx) => {
      if (idx === currentSlot.subjectTeacherPairs.length - 1) {
        return {
          ...pair,
          teacherIds: [...pair.teacherIds, teacherId]
        };
      }
      return pair;
    });
    
    // Also update old structure for compatibility
    const newTeachers = [...(currentSlot?.teacherIds || []), teacherId];
    
    // Update both structures
    const updatedSlots = timetableSlots[day]?.map((slot, i) => 
      i === index ? { 
        ...slot, 
        teacherIds: newTeachers,
        subjectTeacherPairs: updatedPairs
      } : slot
    ) || [];
    
    setTimetableSlots(prev => ({
      ...prev,
      [day]: updatedSlots
    }));
    
    // Remove the selected teacher from the filtered list to prevent re-selection
    const updatedFilteredTeachers = filteredTeachers.filter(t => t.id !== teacherId);
    setFilteredTeachers(updatedFilteredTeachers);
    
    const lastSubject = subjects.find(s => s.id === lastSubjectPair.subjectId);
    setSuccess(`Teacher "${teacher?.firstName} ${teacher?.lastName}" added to "${lastSubject?.name}"!`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const confirmTeacherSelection = (day: string, index: number) => {
    updateTimetableSlot(day, index, 'teacherIds', selectedTeachers);
    setShowTeacherConfirmation(false);
    setSelectedTeachers([]);
    setCurrentSlotIndex(null);
  };

  const cancelTeacherSelection = () => {
    setShowTeacherConfirmation(false);
    setSelectedTeachers([]);
    setCurrentSlotIndex(null);
  };

  const removeSubject = async (day: string, index: number, subjectId: number) => {
    const currentSlot = timetableSlots[day]?.[index];
    
    // Remove from both old and new structures
    const newSubjects = (currentSlot?.subjectIds || []).filter(id => id !== subjectId);
    const newPairs = (currentSlot?.subjectTeacherPairs || []).filter(pair => pair.subjectId !== subjectId);
    
    // Collect teacherIds from remaining pairs for old structure
    const remainingTeacherIds = newPairs.flatMap(pair => pair.teacherIds);
    
    // Update both structures
    const updatedSlots = timetableSlots[day]?.map((slot, i) => 
      i === index ? { 
        ...slot, 
        subjectIds: newSubjects,
        teacherIds: remainingTeacherIds,
        subjectTeacherPairs: newPairs
      } : slot
    ) || [];
    
    setTimetableSlots(prev => ({
      ...prev,
      [day]: updatedSlots
    }));
    
    // Re-filter teachers based on remaining subjects
    if (newSubjects.length > 0 && selectedClass && selectedAcademicYear) {
      try {
        const response = await fetch(`/api/teachers/by-subjects?subjectIds=${newSubjects.join(',')}&classId=${selectedClass}&academicYearId=${selectedAcademicYear}`);
        if (response.ok) {
          const teachers = await response.json();
          setFilteredTeachers(teachers);
        }
      } catch (error) {
        console.error('Error fetching teachers for remaining subjects:', error);
      }
    } else {
      setFilteredTeachers(teachers);
    }
  };

  const removeTeacher = (day: string, index: number, teacherId: string) => {
    const currentSlot = timetableSlots[day]?.[index];
    
    // Remove teacher from subjectTeacherPairs (from the last subject that has this teacher)
    const updatedPairs = (currentSlot?.subjectTeacherPairs || []).map(pair => {
      if (pair.teacherIds.includes(teacherId)) {
        return {
          ...pair,
          teacherIds: pair.teacherIds.filter(id => id !== teacherId)
        };
      }
      return pair;
    });
    
    // Remove from old structure
    const newTeachers = (currentSlot?.teacherIds || []).filter(id => id !== teacherId);
    
    // Update both structures
    const updatedSlots = timetableSlots[day]?.map((slot, i) => 
      i === index ? { 
        ...slot, 
        teacherIds: newTeachers,
        subjectTeacherPairs: updatedPairs
      } : slot
    ) || [];
    
    setTimetableSlots(prev => ({
      ...prev,
      [day]: updatedSlots
    }));
    
    // Add the teacher back to the filtered list
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      setFilteredTeachers(prev => [...prev, teacher]);
    }
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
          // Use subjectTeacherPairs if available, otherwise fall back to old structure
          const hasSubjectTeacherPairs = slot.subjectTeacherPairs && slot.subjectTeacherPairs.length > 0;
          const hasSubjectIds = slot.subjectIds && slot.subjectIds.length > 0;
          
          if (slot.startTime && slot.endTime && (hasSubjectTeacherPairs || hasSubjectIds)) {
            allSlots.push({
              branchId: selectedBranch,
              classId: selectedClass,
              academicYearId: selectedAcademicYear,
              dayOfWeek: day,
              subjectTeacherPairs: hasSubjectTeacherPairs ? slot.subjectTeacherPairs : undefined,
              subjectIds: hasSubjectIds ? slot.subjectIds : undefined,
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
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">Subject Assignment Required</h2>
            </div>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Subjects
                      </label>
                      
                      {/* Selected Subjects Display */}
                      {slot.subjectIds.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 font-medium">Selected Subjects:</div>
                          <div className="flex flex-wrap gap-2">
                            <AnimatePresence>
                              {slot.subjectIds.map(subjectId => {
                                const subject = subjects.find(s => s.id === subjectId);
                                return (
                                  <motion.div
                                    key={subjectId}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                  >
                                    <span>{subject?.name}</span>
                                    <button
                                      onClick={() => removeSubject(currentDay, index, subjectId)}
                                      className="text-blue-600 hover:text-blue-800 transition-colors hover:bg-blue-200 rounded-full p-0.5"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                      
                      {/* Subject Selection Grid */}
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2 bg-white">
                        {loading ? (
                          <div className="text-center py-8 text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-sm">Loading subjects...</p>
                          </div>
                        ) : subjects.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No subjects available</p>
                            <button
                              onClick={() => fetchSubjects(true)}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Retry
                            </button>
                          </div>
                        ) : (
                          subjects.map(subject => {
                            const isSelected = slot.subjectIds.includes(subject.id);
                            return (
                              <div
                                key={subject.id}
                                className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                <span className="text-sm font-medium text-gray-700">
                                  {subject.name}
                                </span>
                                <motion.button
                                  onClick={() => handleIndividualSubjectSelection(currentDay, index, subject.id)}
                                  disabled={isSelected || isProcessingSubject === subject.id}
                                  whileHover={!isSelected && isProcessingSubject !== subject.id ? { scale: 1.05 } : {}}
                                  whileTap={!isSelected && isProcessingSubject !== subject.id ? { scale: 0.95 } : {}}
                                  className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                      : isProcessingSubject === subject.id
                                      ? 'bg-gray-400 text-white cursor-not-allowed'
                                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                                  }`}
                                >
                                  {isSelected ? (
                                    <>
                                      <BookCheck className="w-3 h-3" />
                                      Added
                                    </>
                                  ) : isProcessingSubject === subject.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      Loading...
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      Add
                                    </>
                                  )}
                                </motion.button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Teacher Selection */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Teachers
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
                      
                      {/* Selected Teachers Display */}
                      {slot.teacherIds.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 font-medium">Selected Teachers:</div>
                          <div className="flex flex-wrap gap-2">
                            <AnimatePresence>
                              {slot.teacherIds.map(teacherId => {
                                const teacher = filteredTeachers.find(t => t.id === teacherId);
                                return (
                                  <motion.div
                                    key={teacherId}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                                  >
                                    <span>{teacher ? `${teacher.firstName} ${teacher.lastName}` : teacherId}</span>
                                    <button
                                      onClick={() => removeTeacher(currentDay, index, teacherId)}
                                      className="text-green-600 hover:text-green-800 transition-colors hover:bg-green-200 rounded-full p-0.5"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                      
                      {/* Teacher Selection Grid */}
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                        {loading ? (
                          <div className="text-center py-8 text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-sm">Loading teachers...</p>
                          </div>
                        ) : filteredTeachers.length > 0 ? (
                          filteredTeachers.map(teacher => {
                            const isSelected = slot.teacherIds.includes(teacher.id);
                            return (
                              <div
                                key={teacher.id}
                                className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                                  isSelected
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-700">
                                    {teacher.firstName} {teacher.lastName}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ID: {teacher.teacherId}
                                  </span>
                                </div>
                                <motion.button
                                  onClick={() => handleIndividualTeacherSelection(currentDay, index, teacher.id)}
                                  disabled={isSelected}
                                  whileHover={!isSelected ? { scale: 1.05 } : {}}
                                  whileTap={!isSelected ? { scale: 0.95 } : {}}
                                  className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                      : 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md'
                                  }`}
                                >
                                  {isSelected ? (
                                    <>
                                      <UserCheck className="w-3 h-3" />
                                      Added
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      Add
                                    </>
                                  )}
                                </motion.button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              {slot.subjectIds.length === 0
                                ? "Please select subjects first"
                                : "Select class and academic year to see teachers"}
                            </p>
                          </div>
                        )}
                      </div>
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
