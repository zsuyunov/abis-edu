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
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';

interface Timetable {
  id: number;
  dayOfWeek: string;
  subjectId: number | null;
  startTime: string;
  endTime: string;
  roomNumber: string | null;
  buildingName: string | null;
  isActive: boolean;
  class: {
    id: number;
    name: string;
  };
  subject: {
    id: number;
    name: string;
  } | null;
  branch: {
    id: number;
    shortName: string;
  };
  academicYear: {
    id: number;
    name: string;
  };
}

interface TeacherTimetableViewProps {
  teacherId: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TeacherTimetableView: React.FC<TeacherTimetableViewProps> = ({ teacherId }) => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  useEffect(() => {
    fetchTeacherTimetables();
  }, [teacherId]);

  const fetchTeacherTimetables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/teacher-timetables?teacherId=${teacherId}`);
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
          <h1 className="text-3xl font-bold text-gray-900">My Timetable</h1>
          <p className="text-gray-600 mt-1">View your assigned classes and schedules</p>
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

          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Error Message */}
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
                          {dayTimetables.map((timetable, index) => (
                            <motion.div
                              key={timetable.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-3 rounded-lg mb-2 bg-blue-50 border border-blue-200"
                            >
                              <div className="font-medium text-gray-900 text-sm mb-1">
                                {timetable.subject?.name || 'No Subject'}
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                Class: {timetable.class.name}
                              </div>
                              {timetable.roomNumber && (
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {timetable.roomNumber}
                                  {timetable.buildingName && ` (${timetable.buildingName})`}
                                </div>
                              )}
                            </motion.div>
                          ))}
                          {dayTimetables.length === 0 && (
                            <div className="h-16 flex items-center justify-center text-gray-400">
                              <span className="text-xs">Free</span>
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
              {getTimetablesForDay(selectedDay).map((timetable, index) => (
                <motion.div
                  key={timetable.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-lg border bg-blue-50 border-blue-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <Clock className="w-4 h-4" />
                          {formatTime(timetable.startTime)} - {formatTime(timetable.endTime)}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {timetable.subject?.name || 'No Subject'}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Class: {timetable.class.name}
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
                  </div>
                </motion.div>
              ))}
              
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {new Set(timetables.filter(t => t.isActive).map(t => t.subjectId)).size}
              </div>
              <div className="text-sm text-gray-600">Subjects</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {new Set(timetables.filter(t => t.isActive).map(t => t.class.id)).size}
              </div>
              <div className="text-sm text-gray-600">Classes</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {timetables.filter(t => t.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Weekly Lessons</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Eye className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {timetables.filter(t => t.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Total Classes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherTimetableView;
