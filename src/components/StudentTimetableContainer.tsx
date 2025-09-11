"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays, isToday, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";

interface StudentTimetableContainerProps {
  studentId: string;
}

interface TimetableEntry {
  id: string;
  fullDate: string;
  startTime: string;
  endTime: string;
  lessonNumber: number;
  classroom: string;
  subject: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    shortName: string;
  };
  topics: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  teacher: {
    firstName: string;
    lastName: string;
  };
}

const StudentTimetableContainer = ({ studentId }: StudentTimetableContainerProps) => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetableData();
  }, [selectedDate, studentId]);

  const fetchTimetableData = async () => {
    try {
      setLoading(true);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const startDate = `${year}-${month}-${day}`;

      const response = await fetch(
        `/api/student-timetable?studentId=${studentId}&date=${startDate}`,
        {
          headers: {
            'x-user-id': studentId,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTimetables(data);
      }
    } catch (error) {
      console.error("Error fetching timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLessonStatus = (timetable: TimetableEntry) => {
    const now = new Date();
    const lessonStart = new Date(`${timetable.fullDate}T${timetable.startTime}`);
    const lessonEnd = new Date(`${timetable.fullDate}T${timetable.endTime}`);

    if (now >= lessonStart && now <= lessonEnd) {
      return 'in-progress';
    } else if (now > lessonEnd) {
      return 'completed';
    } else {
      return 'upcoming';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-progress':
        return t('teacher.schedule.status.inProgress');
      case 'completed':
        return t('teacher.schedule.status.completed');
      default:
        return t('teacher.schedule.status.upcoming');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return "bg-green-100 text-green-700";
      case 'completed':
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const currentWeek = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 1 })
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(current =>
      direction === 'prev'
        ? subWeeks(current, 1)
        : addWeeks(current, 1)
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {t('teacher.schedule.title')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium">
            {format(currentWeek[0], "MMM d")} - {format(currentWeek[6], "MMM d, yyyy")}
          </span>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {currentWeek.map((day, index) => (
          <button
            key={index}
            onClick={() => setSelectedDate(day)}
            className={`p-3 rounded-lg text-center transition-colors ${
              isSameDay(day, selectedDate)
                ? "bg-blue-500 text-white"
                : isToday(day)
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            <div className="text-xs font-medium mb-1">
              {format(day, "EEE")}
            </div>
            <div className="text-lg font-bold">
              {format(day, "d")}
            </div>
          </button>
        ))}
      </div>

      {/* Timetable Content */}
      <div className="space-y-4">
        {timetables.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('teacher.schedule.noLessons')}
            </h3>
            <p className="text-gray-600">
              {t('teacher.schedule.enjoyFreeTime')}
            </p>
          </div>
        ) : (
          timetables.map((timetable, index) => {
            const lessonStatus = getLessonStatus(timetable);

            return (
              <div
                key={timetable.id}
                className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col gap-4">
                  {/* Header with lesson number and location */}
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    {timetable.lessonNumber} {t('teacher.schedule.lesson')}, {timetable.branch.shortName} {t('teacher.schedule.room')}: {timetable.classroom}
                  </div>

                  {/* Main content */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left side - Lesson info */}
                    <div className="flex-1">
                      {/* Subject */}
                      <div className="text-xl font-bold text-gray-900 mb-2">
                        {timetable.subject.name}
                      </div>

                      {/* Teacher */}
                      <div className="text-sm text-gray-600 mb-2">
                        {t('form.student')}: {timetable.teacher.firstName} {timetable.teacher.lastName}
                      </div>

                      {/* Time */}
                      <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {timetable.startTime} – {timetable.endTime}
                      </div>

                      {/* Topic */}
                      <div className="text-sm text-gray-600 mb-4">
                        {timetable.topics.length > 0
                          ? timetable.topics[0].title
                          : t('teacher.schedule.noLessonTopic')
                        }
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(lessonStatus)}`}>
                          {getStatusBadge(lessonStatus)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentTimetableContainer;
