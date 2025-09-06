"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LessonTopicViewer from "./LessonTopicViewer";

interface ParentMultiChildDashboardProps {
  parentId: string;
  filters: any;
  timeFilter: "current" | "past";
  dateRange: { start: Date; end: Date };
  onParentDataUpdate: (data: any) => void;
}

const ParentMultiChildDashboard = ({ 
  parentId, 
  filters, 
  timeFilter,
  dateRange,
  onParentDataUpdate 
}: ParentMultiChildDashboardProps) => {
  const [allChildTimetables, setAllChildTimetables] = useState([]);
  const [combinedTimetables, setCombinedTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showTopicViewer, setShowTopicViewer] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchMultiChildData();
  }, [parentId, filters, dateRange, timeFilter]);

  const fetchMultiChildData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        parentId,
        ...filters,
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0],
        view: "multi-child",
        timeFilter,
      });

      const response = await fetch(`/api/parent-timetables?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setAllChildTimetables(data.allChildTimetables || []);
        setCombinedTimetables(data.timetables || []);
        onParentDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching multi-child data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const isToday = (date: string) => {
    const today = new Date().toDateString();
    const timetableDate = new Date(date).toDateString();
    return today === timetableDate;
  };

  const isPastClass = (timetable: any) => {
    const classDateTime = new Date(timetable.fullDate + 'T' + new Date(timetable.endTime).toTimeString().split(' ')[0]);
    return classDateTime < new Date();
  };

  const isUpcomingClass = (timetable: any) => {
    const classDateTime = new Date(timetable.fullDate + 'T' + new Date(timetable.startTime).toTimeString().split(' ')[0]);
    const now = new Date();
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return classDateTime >= now && classDateTime <= in2Hours;
  };

  const getChildColor = (childId: string) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500",
      "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-red-500"
    ];
    const index = childId.length % colors.length;
    return colors[index];
  };

  const groupTimetablesByDate = () => {
    const grouped: Record<string, any[]> = {};
    
    combinedTimetables.forEach((timetable: any) => {
      const date = timetable.fullDate.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(timetable);
    });

    // Sort dates and timetables within each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return Object.entries(grouped).sort(([a], [b]) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
  };

  const getChildSummary = () => {
    return allChildTimetables.map(({ child, timetables }) => {
      const todayTimetables = timetables.filter((t: any) => isToday(t.fullDate));
      const upcomingTimetables = timetables.filter((t: any) => isUpcomingClass(t));
      const totalTopics = timetables.reduce((sum: number, t: any) => sum + t.topics.length, 0);
      const completedTopics = timetables.reduce((sum: number, t: any) => 
        sum + t.topics.filter((topic: any) => topic.status === "COMPLETED").length, 0
      );

      return {
        child,
        totalClasses: timetables.length,
        todayClasses: todayTimetables.length,
        upcomingClasses: upcomingTimetables.length,
        totalTopics,
        completedTopics,
        completionRate: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
        nextClass: todayTimetables.find((t: any) => new Date(t.startTime) > new Date()),
      };
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-200 h-16 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const groupedTimetables = groupTimetablesByDate();
  const childSummaries = getChildSummary();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          This Week's Overview - All Children
        </h2>
        <p className="text-gray-600">
          Combined schedule for all your children from {formatDate(dateRange.start.toISOString())} to {formatDate(dateRange.end.toISOString())}
        </p>
        {timeFilter === "past" && (
          <span className="inline-block mt-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            📚 Archived Data
          </span>
        )}
      </div>

      {/* CHILDREN SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {childSummaries.map(({ child, totalClasses, todayClasses, upcomingClasses, totalTopics, completedTopics, completionRate, nextClass }) => (
          <div key={child.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${getChildColor(child.id)} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                {child.firstName.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {child.firstName} {child.lastName}
                </h3>
                <p className="text-sm text-gray-600">
                  {child.class.name} • {child.studentId}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-bold text-blue-600">{totalClasses}</div>
                <div className="text-gray-600">Total Classes</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-bold text-green-600">{todayClasses}</div>
                <div className="text-gray-600">Today</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="font-bold text-purple-600">{totalTopics}</div>
                <div className="text-gray-600">Topics</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <div className="font-bold text-orange-600">{completionRate}%</div>
                <div className="text-gray-600">Complete</div>
              </div>
            </div>

            {nextClass && timeFilter === "current" && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm font-medium text-yellow-800">Next Class:</div>
                <div className="text-sm text-yellow-700">
                  {nextClass.subject.name} at {formatTime(nextClass.startTime)}
                </div>
              </div>
            )}

            {upcomingClasses > 0 && timeFilter === "current" && (
              <div className="mt-2 text-center">
                <span className="inline-block text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  {upcomingClasses} upcoming class{upcomingClasses > 1 ? 'es' : ''}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* COMBINED WEEKLY SCHEDULE */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Combined Weekly Schedule</h3>
          <p className="text-sm text-gray-600 mt-1">
            All classes for all children sorted by date and time
          </p>
        </div>

        {groupedTimetables.length === 0 ? (
          <div className="text-center py-12">
            <Image
              src="/calendar.png"
              alt="No classes"
              width={64}
              height={64}
              className="mx-auto mb-4 opacity-50"
            />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Classes This Week</h4>
            <p className="text-gray-600">
              {timeFilter === "current" ? "Enjoy the free time!" : "No archived classes for this period."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groupedTimetables.map(([date, dayTimetables]) => (
              <div key={date} className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <h4 className={`font-semibold ${isToday(date) && timeFilter === "current" ? "text-blue-600" : "text-gray-900"}`}>
                    {formatDate(date)}
                  </h4>
                  {isToday(date) && timeFilter === "current" && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Today
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {dayTimetables.length} class{dayTimetables.length > 1 ? 'es' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dayTimetables.map((timetable: any) => (
                    <div
                      key={timetable.id}
                      onClick={() => {
                        setSelectedTimetable(timetable);
                        setShowTopicViewer(true);
                      }}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        timeFilter === "current" && isUpcomingClass(timetable)
                          ? "bg-blue-50 border-blue-300 hover:bg-blue-100"
                          : timeFilter === "current" && isPastClass(timetable)
                          ? "bg-gray-50 border-gray-200 opacity-75 hover:bg-gray-100"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 ${getChildColor(timetable.childInfo.id)} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                          {timetable.childInfo.firstName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {timetable.subject.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {timetable.childInfo.firstName} • {timetable.childInfo.class.name}
                          </div>
                        </div>
                        {timeFilter === "current" && isUpcomingClass(timetable) && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Soon
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Image src="/lesson.png" alt="Time" width={12} height={12} />
                          {formatTime(timetable.startTime)} - {formatTime(timetable.endTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Image src="/teacher.png" alt="Teacher" width={12} height={12} />
                          {timetable.teacher.firstName} {timetable.teacher.lastName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Image src="/singleClass.png" alt="Room" width={12} height={12} />
                          Room {timetable.roomNumber}
                        </div>
                        <div className="flex items-center gap-1">
                          <Image src="/create.png" alt="Topics" width={12} height={12} />
                          {timetable.topics.length > 0 
                            ? `${timetable.topics.length} topic${timetable.topics.length > 1 ? 's' : ''}`
                            : "No topics"
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WEEKLY SUMMARY */}
      {combinedTimetables.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Weekly Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{combinedTimetables.length}</div>
              <div className="text-sm text-gray-600">Total Classes</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {combinedTimetables.filter((t: any) => t.topics.length > 0).length}
              </div>
              <div className="text-sm text-gray-600">With Topics</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {combinedTimetables.reduce((sum: number, t: any) => sum + t.topics.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Topics</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{allChildTimetables.length}</div>
              <div className="text-sm text-gray-600">Children</div>
            </div>
          </div>
        </div>
      )}

      {/* LESSON TOPIC VIEWER MODAL */}
      {showTopicViewer && selectedTimetable && (
        <LessonTopicViewer
          timetable={selectedTimetable}
          isReadOnly={true} // Parents always have read-only access
          onClose={() => {
            setShowTopicViewer(false);
            setSelectedTimetable(null);
          }}
        />
      )}
    </div>
  );
};

export default ParentMultiChildDashboard;
