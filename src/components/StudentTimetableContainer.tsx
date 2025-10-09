"use client";

import { useState } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentWeeklyTimetable from "./StudentWeeklyTimetable";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface StudentTimetableContainerProps {
  studentId: string;
}

const StudentTimetableContainer = ({ studentId }: StudentTimetableContainerProps) => {
  const { t } = useLanguage();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(current =>
      direction === 'prev'
        ? subWeeks(current, 1)
        : addWeeks(current, 1)
    );
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const isCurrentWeek = () => {
    const now = new Date();
    const nowStart = startOfWeek(now, { weekStartsOn: 1 });
    return format(nowStart, 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd');
  };

  return (
    <div className="space-y-4">
      {/* Header with Week Navigation */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('teacher.schedule.title')}
              </h2>
              <p className="text-sm text-gray-600">
                {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isCurrentWeek() && (
              <button
                onClick={goToToday}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
              >
                Today
              </button>
            )}
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Timetable */}
      <StudentWeeklyTimetable 
        studentId={studentId}
        dateRange={{ start: weekStart, end: weekEnd }}
      />
    </div>
  );
};

export default StudentTimetableContainer;
