"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import TimetableTopicModal from "./TimetableTopicModal";

interface TeacherWeeklyTimetableProps {
  teacherId: string;
  filters: any;
  dateRange: { start: Date; end: Date };
}

const TeacherWeeklyTimetable = ({ teacherId, filters, dateRange }: TeacherWeeklyTimetableProps) => {
  const [timetables, setTimetables] = useState([]);
  const [supervisedTimetables, setSupervisedTimetables] = useState([]);
  const [supervisedClasses, setSupervisedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [viewMode, setViewMode] = useState<"own" | "supervised">("own");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  useEffect(() => {
    fetchTimetables();
  }, [teacherId, filters, dateRange]);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        teacherId,
        ...filters,
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0],
        view: "weekly",
      });

      const response = await fetch(`/api/teacher-timetables?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setTimetables(data.timetables || []);
        setSupervisedTimetables(data.supervisedTimetables || []);
        setSupervisedClasses(data.supervisedClasses || []);
      }
    } catch (error) {
      console.error("Error fetching timetables:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getDayFromDate = (date: string) => {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayIndex = new Date(date).getDay();
    return dayNames[dayIndex];
  };

  const getTimetableForSlot = (day: string, timeSlot: string) => {
    const currentTimetables = viewMode === "own" ? timetables : supervisedTimetables;
    
    return currentTimetables.find((timetable: any) => {
      const timetableDay = getDayFromDate(timetable.fullDate);
      const timetableTime = formatTime(timetable.startTime);
      return timetableDay === day.toLowerCase() && timetableTime === timeSlot;
    });
  };

  const isToday = (day: string) => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return day === today;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getTopicStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600";
      case "IN_PROGRESS":
        return "text-blue-600";
      case "DRAFT":
        return "text-gray-600";
      case "CANCELLED":
        return "text-red-600";
      default:
        return "text-gray-400";
    }
  };

  const handleAddTopic = (timetable: any) => {
    setSelectedTimetable(timetable);
    setShowTopicModal(true);
  };

  const handleTopicCreated = () => {
    fetchTimetables();
    setShowTopicModal(false);
    setSelectedTimetable(null);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* VIEW MODE SELECTOR */}
      {supervisedClasses.length > 0 && (
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">View Mode:</span>
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode("own")}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === "own"
                  ? "bg-lamaSky text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              My Classes
            </button>
            <button
              onClick={() => setViewMode("supervised")}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === "supervised"
                  ? "bg-lamaSky text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Supervised Classes
            </button>
          </div>
        </div>
      )}

      {/* TIMETABLE GRID */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* HEADER */}
          <div className="grid grid-cols-6 gap-2 mb-4">
            <div className="p-3 bg-gray-100 rounded-md font-medium text-center">
              Time
            </div>
            {days.map((day) => (
              <div
                key={day}
                className={`p-3 rounded-md font-medium text-center ${
                  isToday(day)
                    ? "bg-lamaSky text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* TIME SLOTS */}
          {timeSlots.map((timeSlot) => (
            <div key={timeSlot} className="grid grid-cols-6 gap-2 mb-2">
              {/* TIME COLUMN */}
              <div className="p-3 bg-gray-50 rounded-md text-sm font-medium text-center text-gray-600">
                {timeSlot}
              </div>

              {/* DAY COLUMNS */}
              {days.map((day) => {
                const timetable = getTimetableForSlot(day, timeSlot);
                
                return (
                  <div
                    key={`${day}-${timeSlot}`}
                    className={`p-3 rounded-md border min-h-[80px] ${
                      timetable
                        ? "bg-white border-gray-200 hover:shadow-md transition-shadow"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    {timetable ? (
                      <div className="h-full flex flex-col justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {timetable.subject.name}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            {timetable.class.name} • {timetable.roomNumber}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(timetable.status)}`}>
                            {timetable.status}
                          </div>
                        </div>

                        <div className="mt-2">
                          {/* TOPICS INDICATOR */}
                          {timetable.topics && timetable.topics.length > 0 ? (
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${getTopicStatusColor(timetable.topics[0].status)}`}>
                                ● {timetable.topics.length} topic{timetable.topics.length > 1 ? 's' : ''}
                              </span>
                              <button
                                onClick={() => handleAddTopic(timetable)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                View
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddTopic(timetable)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-lamaSky"
                            >
                              <Image src="/create.png" alt="Add" width={12} height={12} />
                              Add Topic
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-gray-400">
                        No class
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* LEGEND */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Active Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Inactive Class</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 text-green-600">●</span>
            <span>Completed Topic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 text-blue-600">●</span>
            <span>In Progress Topic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 text-gray-600">●</span>
            <span>Draft Topic</span>
          </div>
        </div>
      </div>

      {/* TOPIC MODAL */}
      {showTopicModal && selectedTimetable && (
        <TimetableTopicModal
          timetable={selectedTimetable}
          onClose={() => {
            setShowTopicModal(false);
            setSelectedTimetable(null);
          }}
          onSuccess={handleTopicCreated}
        />
      )}
    </div>
  );
};

export default TeacherWeeklyTimetable;
