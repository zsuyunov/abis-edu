'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  MapPin, 
  Building,
  ChevronLeft,
  ChevronRight,
  Settings,
  Check,
  AlertCircle,
  Star,
  Users
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

interface Timetable {
  id: number;
  dayOfWeek: string;
  subjectId: number | null;
  teacherIds: string[];
  startTime: string;
  endTime: string;
  roomNumber: string | null;
  buildingName: string | null;
  isElective: boolean;
  isActive: boolean;
  subject: {
    id: number;
    name: string;
  } | null;
  teachers?: {
    id: string;
    firstName: string;
    lastName: string;
    teacherId: string;
  }[];
}

interface ElectiveOption {
  subjectId: number;
  teacherId: string;
  subject: {
    id: number;
    name: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    teacherId: string;
  };
}

interface ElectiveSelection {
  id: number;
  timetableId: number;
  subjectId: number;
  teacherId: string;
  subject: {
    id: number;
    name: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    teacherId: string;
  };
}

interface StudentTimetableViewProps {
  studentId: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const StudentTimetableView: React.FC<StudentTimetableViewProps> = ({ studentId }) => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [electiveSelections, setElectiveSelections] = useState<ElectiveSelection[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [showElectiveModal, setShowElectiveModal] = useState(false);
  const [selectedElectiveTimetable, setSelectedElectiveTimetable] = useState<Timetable | null>(null);
  const [electiveOptions, setElectiveOptions] = useState<ElectiveOption[]>([]);

  useEffect(() => {
    fetchStudentTimetables();
    fetchElectiveSelections();
  }, [studentId]);

  const fetchStudentTimetables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/student-timetables?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setTimetables(data);
      } else {
        throw new Error('Failed to fetch timetables');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch timetables');
    } finally {
      setLoading(false);
    }
  };

  const fetchElectiveSelections = async () => {
    try {
      const response = await fetch(`/api/admin/student-electives?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setElectiveSelections(data);
      }
    } catch (error) {
      console.error('Error fetching elective selections:', error);
    }
  };

  const fetchElectiveOptions = async (timetableId: number) => {
    try {
      const response = await fetch(`/api/admin/timetables/${timetableId}`);
      if (response.ok) {
        const timetable = await response.json();
        
        // Generate elective options from teacherIds and available subjects
        const options: ElectiveOption[] = [];
        
        if (timetable.teachers && timetable.teachers.length > 0) {
          // For electives, we assume multiple subject-teacher combinations are available
          // This would typically come from a separate API endpoint for elective options
          timetable.teachers.forEach((teacher: any) => {
            if (timetable.subject) {
              options.push({
                subjectId: timetable.subject.id,
                teacherId: teacher.id,
                subject: timetable.subject,
                teacher: teacher
              });
            }
          });
        }
        
        setElectiveOptions(options);
      }
    } catch (error) {
      console.error('Error fetching elective options:', error);
    }
  };

  const handleElectiveSelection = async (subjectId: number, teacherId: string) => {
    if (!selectedElectiveTimetable) return;

    try {
      const response = await fetch('/api/admin/student-electives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          timetableId: selectedElectiveTimetable.id,
          subjectId,
          teacherId
        })
      });

      if (response.ok) {
        setSuccess('Elective selection saved successfully!');
        fetchElectiveSelections();
        setShowElectiveModal(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to save elective selection');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save elective selection');
    }
  };

  const openElectiveModal = (timetable: Timetable) => {
    setSelectedElectiveTimetable(timetable);
    fetchElectiveOptions(timetable.id);
    setShowElectiveModal(true);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
    setSelectedDay(format(new Date(), 'EEEE'));
  };

  const formatTime = (time: string) => {
    return time.length === 5 ? time : time.substring(0, 5);
  };

  const getTimetablesForDay = (day: string) => {
    return timetables
      .filter(t => t.dayOfWeek === day && t.isActive)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getElectiveSelectionForTimetable = (timetableId: number) => {
    return electiveSelections.find(es => es.timetableId === timetableId);
  };

  const generateWeeklyGrid = () => {
    const grid: { [day: string]: { [timeSlot: string]: Timetable[] } } = {};
    
    DAYS_OF_WEEK.forEach(day => {
      grid[day] = {};
      const dayTimetables = getTimetablesForDay(day);
      
      dayTimetables.forEach(timetable => {
        const timeSlot = `${timetable.startTime}-${timetable.endTime}`;
        if (!grid[day][timeSlot]) {
          grid[day][timeSlot] = [];
        }
        grid[day][timeSlot].push(timetable);
      });
    });

    return grid;
  };

  const getAllTimeSlots = () => {
    const timeSlots = new Set<string>();
    timetables.forEach(t => {
      if (t.isActive) {
        timeSlots.add(`${t.startTime}-${t.endTime}`);
      }
    });
    return Array.from(timeSlots).sort();
  };

  const weeklyGrid = generateWeeklyGrid();
  const allTimeSlots = getAllTimeSlots();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Class Timetable</h1>
          <p className="text-gray-600 mt-1">View your class schedule and manage elective subjects</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'day'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Day View
            </button>
          </div>
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

      {/* Week Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}
              </h2>
            </div>
            
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200 bg-gray-50">
                    Time
                  </th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-200 bg-gray-50">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allTimeSlots.map(timeSlot => (
                  <tr key={timeSlot} className="border-b border-gray-200">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
                      <div>{formatTime(timeSlot.split('-')[0])}</div>
                      <div className="text-xs text-gray-500">{formatTime(timeSlot.split('-')[1])}</div>
                    </td>
                    {DAYS_OF_WEEK.map(day => {
                      const dayTimetables = weeklyGrid[day][timeSlot] || [];
                      return (
                        <td key={day} className="px-2 py-2 border-r border-gray-200 align-top">
                          {dayTimetables.map((timetable, index) => {
                            const electiveSelection = getElectiveSelectionForTimetable(timetable.id);
                            return (
                              <motion.div
                                key={timetable.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-3 rounded-lg mb-2 relative ${
                                  timetable.isElective 
                                    ? 'bg-purple-50 border border-purple-200' 
                                    : 'bg-blue-50 border border-blue-200'
                                }`}
                              >
                                {timetable.isElective && (
                                  <button
                                    onClick={() => openElectiveModal(timetable)}
                                    className="absolute top-2 right-2 p-1 text-purple-600 hover:text-purple-800"
                                    title="Configure elective"
                                  >
                                    <Settings className="w-3 h-3" />
                                  </button>
                                )}
                                
                                <div className="font-medium text-gray-900 text-sm mb-1">
                                  {electiveSelection ? electiveSelection.subject.name : (timetable.subject?.name || 'No Subject')}
                                </div>
                                
                                {electiveSelection ? (
                                  <div className="text-xs text-gray-600 mb-1">
                                    {electiveSelection.teacher.firstName} {electiveSelection.teacher.lastName}
                                  </div>
                                ) : (
                                  timetable.teachers && timetable.teachers.length > 0 && (
                                    <div className="text-xs text-gray-600 mb-1">
                                      {timetable.teachers.map(t => `${t.firstName} ${t.lastName}`).join(', ')}
                                    </div>
                                  )
                                )}
                                
                                {timetable.roomNumber && (
                                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {timetable.roomNumber}
                                    {timetable.buildingName && ` (${timetable.buildingName})`}
                                  </div>
                                )}
                                
                                {timetable.isElective && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-purple-600" />
                                    <span className="text-xs text-purple-700">
                                      {electiveSelection ? 'Selected' : 'Choose Option'}
                                    </span>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                          {dayTimetables.length === 0 && (
                            <div className="h-16 flex items-center justify-center text-gray-400">
                              <span className="text-xs">Free Period</span>
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
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="space-y-4">
            {/* Day Selection */}
            <div className="flex justify-center">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedDay === day
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Day Schedule */}
            <div className="space-y-3">
              {getTimetablesForDay(selectedDay).map((timetable, index) => {
                const electiveSelection = getElectiveSelectionForTimetable(timetable.id);
                return (
                  <motion.div
                    key={timetable.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 rounded-lg border ${
                      timetable.isElective 
                        ? 'bg-purple-50 border-purple-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <Clock className="w-4 h-4" />
                            {formatTime(timetable.startTime)} - {formatTime(timetable.endTime)}
                          </div>
                          {timetable.isElective && (
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Elective
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {electiveSelection ? electiveSelection.subject.name : (timetable.subject?.name || 'No Subject')}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Teacher: {electiveSelection ? 
                              `${electiveSelection.teacher.firstName} ${electiveSelection.teacher.lastName}` :
                              (timetable.teachers && timetable.teachers.length > 0 ? 
                                timetable.teachers.map(t => `${t.firstName} ${t.lastName}`).join(', ') : 
                                'TBA'
                              )
                            }
                          </div>
                          
                          {timetable.roomNumber && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Room: {timetable.roomNumber}
                            </div>
                          )}
                          
                          {timetable.buildingName && (
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              Building: {timetable.buildingName}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {timetable.isElective && (
                        <button
                          onClick={() => openElectiveModal(timetable)}
                          className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          {electiveSelection ? 'Change Selection' : 'Choose Option'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {getTimetablesForDay(selectedDay).length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No classes scheduled</h3>
                  <p className="text-gray-600">You have no classes on {selectedDay}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Elective Selection Modal */}
      <AnimatePresence>
        {showElectiveModal && selectedElectiveTimetable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choose Elective Option
              </h3>
              
              <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600">Time Slot:</div>
                <div className="font-medium text-gray-900">
                  {selectedElectiveTimetable.dayOfWeek}, {formatTime(selectedElectiveTimetable.startTime)} - {formatTime(selectedElectiveTimetable.endTime)}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {electiveOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleElectiveSelection(option.subjectId, option.teacherId)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900 mb-1">
                      {option.subject.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {option.teacher.firstName} {option.teacher.lastName} ({option.teacher.teacherId})
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowElectiveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentTimetableView;
