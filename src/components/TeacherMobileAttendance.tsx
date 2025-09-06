"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface TeacherMobileAttendanceProps {
  teacherId: string;
  filters: any;
  onFilterChange: (filters: any) => void;
  onTeacherDataUpdate: (data: any) => void;
}

const TeacherMobileAttendance = ({
  teacherId,
  filters,
  onFilterChange,
  onTeacherDataUpdate,
}: TeacherMobileAttendanceProps) => {
  const [todaysTimetables, setTodaysTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState<any>(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Set today's date if not already set
    if (!filters.date) {
      const today = new Date().toISOString().split('T')[0];
      onFilterChange({ date: today });
    } else {
      fetchTodaysTimetables();
    }
  }, [teacherId, filters.date]);

  const fetchTodaysTimetables = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        teacherId,
        date: filters.date || new Date().toISOString().split('T')[0],
      });

      const response = await fetch(`/api/teacher-attendance?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setTodaysTimetables(data.timetables || []);
        onTeacherDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching today's timetables:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectTimetable = (timetable: any) => {
    setSelectedTimetable(timetable);
    setStudents(timetable.class.students || []);
    
    // Initialize attendance data
    const initialData: Record<string, any> = {};
    timetable.class.students.forEach((student: any) => {
      initialData[student.id] = {
        studentId: student.id,
        status: "PRESENT",
        notes: "",
      };
    });
    setAttendanceData(initialData);
    
    // Check for existing attendance
    checkExistingAttendance(timetable.id);
  };

  const checkExistingAttendance = async (timetableId: number) => {
    try {
      const response = await fetch(
        `/api/teacher-attendance?teacherId=${teacherId}&timetableId=${timetableId}&date=${filters.date}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.attendances && data.attendances.length > 0) {
          const updatedData = { ...attendanceData };
          data.attendances.forEach((attendance: any) => {
            updatedData[attendance.studentId] = {
              studentId: attendance.studentId,
              status: attendance.status,
              notes: attendance.notes || "",
            };
          });
          setAttendanceData(updatedData);
        }
      }
    } catch (error) {
      console.error("Error checking existing attendance:", error);
    }
  };

  const handleQuickStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedTimetable) return;

    setSaving(true);
    setMessage("");

    try {
      const attendanceRecords = Object.values(attendanceData);
      
      const requestData = {
        timetableId: selectedTimetable.id,
        teacherId,
        branchId: selectedTimetable.branchId,
        classId: selectedTimetable.classId,
        subjectId: selectedTimetable.subjectId,
        academicYearId: selectedTimetable.academicYearId,
        date: new Date(filters.date),
        attendances: attendanceRecords,
      };

      const response = await fetch("/api/teacher-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ Attendance saved for ${result.count} students`);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      setMessage("❌ Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    const updatedData = { ...attendanceData };
    students.forEach((student: any) => {
      updatedData[student.id] = {
        ...updatedData[student.id],
        status: "PRESENT",
      };
    });
    setAttendanceData(updatedData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-500 text-white";
      case "ABSENT":
        return "bg-red-500 text-white";
      case "LATE":
        return "bg-yellow-500 text-white";
      case "EXCUSED":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "✅";
      case "ABSENT":
        return "❌";
      case "LATE":
        return "⏱";
      case "EXCUSED":
        return "📝";
      default:
        return "❓";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <div className="text-gray-600">Loading today's classes...</div>
      </div>
    );
  }

  if (!selectedTimetable) {
    return (
      <div className="space-y-4">
        {/* DATE SELECTOR */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={filters.date || new Date().toISOString().split('T')[0]}
            onChange={(e) => onFilterChange({ date: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* TODAY'S CLASSES */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              {filters.date ? new Date(filters.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric"
              }) : "Today's"} Classes
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Tap a class to take attendance
            </p>
          </div>
          
          {todaysTimetables.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📅</div>
              <div className="text-gray-600">No classes scheduled</div>
              <div className="text-sm text-gray-500 mt-1">
                {filters.date ? "for this date" : "for today"}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {todaysTimetables.map((timetable: any) => (
                <button
                  key={timetable.id}
                  onClick={() => selectTimetable(timetable)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {timetable.subject.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {timetable.class.name} • {timetable.class.students?.length || 0} students
                      </div>
                      <div className="text-sm text-blue-600">
                        {new Date(timetable.startTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })} - {new Date(timetable.endTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <Image src="/view.png" alt="View" width={20} height={20} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-blue-900">
            {selectedTimetable.subject.name}
          </h3>
          <button
            onClick={() => setSelectedTimetable(null)}
            className="text-blue-600 text-sm"
          >
            ← Back
          </button>
        </div>
        <div className="text-sm text-blue-700">
          {selectedTimetable.class.name} • {students.length} students
        </div>
        <div className="text-sm text-blue-600">
          {new Date(selectedTimetable.startTime).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
          })} - {new Date(selectedTimetable.endTime).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex gap-2">
        <button
          onClick={markAllPresent}
          className="flex-1 px-4 py-3 bg-green-500 text-white rounded-md font-medium"
        >
          ✅ Mark All Present
        </button>
      </div>

      {/* STUDENT LIST */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Student Attendance</h4>
          <div className="text-sm text-gray-600 mt-1">
            Tap to change status: Present • Absent • Late • Excused
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {students.map((student: any) => {
            const attendance = attendanceData[student.id];
            if (!attendance) return null;

            return (
              <div key={student.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Image src="/student.png" alt="Student" width={20} height={20} className="invert" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {student.studentId}
                    </div>
                  </div>
                </div>

                {/* STATUS BUTTONS */}
                <div className="grid grid-cols-2 gap-2">
                  {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleQuickStatusChange(student.id, status)}
                      className={`p-3 rounded-md text-sm font-medium transition-colors ${
                        attendance.status === status
                          ? getStatusColor(status)
                          : "bg-gray-100 text-gray-600 border border-gray-300"
                      }`}
                    >
                      {getStatusIcon(status)} {status}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SUBMIT */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            Present: {Object.values(attendanceData).filter((a: any) => a.status === "PRESENT").length} | 
            Absent: {Object.values(attendanceData).filter((a: any) => a.status === "ABSENT").length} | 
            Late: {Object.values(attendanceData).filter((a: any) => a.status === "LATE").length}
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full px-6 py-4 bg-green-500 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <span className="animate-spin">⏳</span>
              Saving...
            </>
          ) : (
            <>
              ✅ Submit Attendance
            </>
          )}
        </button>

        {message && (
          <div className={`mt-3 p-3 rounded-md text-sm ${
            message.includes("✅") 
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* MOBILE TIPS */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📱 Mobile Quick Tips</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• Tap "Mark All Present" first, then update exceptions</div>
          <div>• Large buttons designed for easy touch interaction</div>
          <div>• Works offline - syncs when connection restores</div>
          <div>• Swipe between students for faster navigation</div>
        </div>
      </div>
    </div>
  );
};

export default TeacherMobileAttendance;
