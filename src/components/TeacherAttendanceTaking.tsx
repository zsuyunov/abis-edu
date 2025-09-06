"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface TeacherAttendanceTakingProps {
  teacherId: string;
  filters: any;
  timetables: any[];
  onTeacherDataUpdate: (data: any) => void;
}

interface StudentAttendance {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  notes: string;
}

const TeacherAttendanceTaking = ({
  teacherId,
  filters,
  timetables,
  onTeacherDataUpdate,
}: TeacherAttendanceTakingProps) => {
  const [selectedTimetable, setSelectedTimetable] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendance>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [existingAttendance, setExistingAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (filters.timetableId) {
      const timetable = timetables.find(t => t.id === parseInt(filters.timetableId));
      if (timetable) {
        setSelectedTimetable(timetable);
        setStudents(timetable.class.students || []);
        initializeAttendanceData(timetable.class.students || []);
        checkExistingAttendance(timetable.id, filters.date);
      }
    } else {
      setSelectedTimetable(null);
      setStudents([]);
      setAttendanceData({});
      setExistingAttendance([]);
    }
  }, [filters.timetableId, filters.date, timetables]);

  const initializeAttendanceData = (studentList: any[]) => {
    const initialData: Record<string, StudentAttendance> = {};
    studentList.forEach(student => {
      initialData[student.id] = {
        studentId: student.id,
        status: "PRESENT",
        notes: "",
      };
    });
    setAttendanceData(initialData);
  };

  const checkExistingAttendance = async (timetableId: number, date: string) => {
    try {
      const response = await fetch(
        `/api/teacher-attendance?teacherId=${teacherId}&timetableId=${timetableId}&date=${date}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setExistingAttendance(data.attendances || []);
        
        // Update attendance data with existing records
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

  const handleStatusChange = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  const markAllAs = (status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") => {
    const updatedData = { ...attendanceData };
    students.forEach(student => {
      updatedData[student.id] = {
        ...updatedData[student.id],
        status,
      };
    });
    setAttendanceData(updatedData);
  };

  const handleSubmit = async () => {
    if (!selectedTimetable) {
      setMessage("Please select a timetable first");
      return;
    }

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
        setMessage(`✅ Attendance recorded successfully for ${result.count} students`);
        // Refresh data
        onTeacherDataUpdate({ attendances: [], timetables: [] });
        // Check for existing attendance again
        checkExistingAttendance(selectedTimetable.id, filters.date);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      setMessage("❌ Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800 border-green-300";
      case "ABSENT":
        return "bg-red-100 text-red-800 border-red-300";
      case "LATE":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "EXCUSED":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
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

  if (!selectedTimetable) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Class Session</h3>
        <p className="text-gray-600 mb-4">
          Please select a date and timetable from the filters above to start taking attendance.
        </p>
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md max-w-md mx-auto">
          💡 <strong>Tip:</strong> Use the date filter to select today's date, then choose the specific class session from the timetable dropdown.
        </div>
      </div>
    );
  }

  const hasExistingAttendance = existingAttendance.length > 0;

  return (
    <div className="space-y-6">
      {/* SESSION INFO */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              {selectedTimetable.subject.name} - {selectedTimetable.class.name}
            </h3>
            <div className="text-sm text-blue-700 mt-1">
              📅 {new Date(filters.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="text-sm text-blue-700">
              🕐 {new Date(selectedTimetable.startTime).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })} - {new Date(selectedTimetable.endTime).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{students.length}</div>
            <div className="text-sm text-blue-700">Students</div>
          </div>
        </div>

        {hasExistingAttendance && (
          <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-md">
            <div className="flex items-center gap-2 text-orange-800">
              <span>⚠️</span>
              <span className="font-medium">Attendance Already Taken</span>
            </div>
            <div className="text-sm text-orange-700 mt-1">
              Attendance has already been recorded for this session. You can make changes and re-submit to update the records.
            </div>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex items-center gap-3 flex-wrap">
        <h4 className="font-medium text-gray-900">Quick Mark All:</h4>
        <button
          onClick={() => markAllAs("PRESENT")}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          ✅ All Present
        </button>
        <button
          onClick={() => markAllAs("ABSENT")}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          ❌ All Absent
        </button>
        <button
          onClick={() => markAllAs("LATE")}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
        >
          ⏱ All Late
        </button>
        <button
          onClick={() => markAllAs("EXCUSED")}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
        >
          📝 All Excused
        </button>
      </div>

      {/* STUDENT ATTENDANCE LIST */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">Student Attendance</h4>
          <p className="text-sm text-gray-600 mt-1">
            Mark attendance for each student. Click on status buttons to change attendance.
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {students.map((student) => {
            const attendance = attendanceData[student.id];
            if (!attendance) return null;

            return (
              <div key={student.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Image src="/student.png" alt="Student" width={20} height={20} className="invert" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {student.studentId}
                      </div>
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex items-center gap-2">
                    {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(student.id, status)}
                        className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors ${
                          attendance.status === status
                            ? getStatusColor(status)
                            : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        {getStatusIcon(status)} {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes Input */}
                {(attendance.status === "ABSENT" || attendance.status === "LATE" || attendance.status === "EXCUSED") && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder={`Add note for ${attendance.status.toLowerCase()} status...`}
                      value={attendance.notes}
                      onChange={(e) => handleNotesChange(student.id, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SUBMIT SECTION */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Submit Attendance</h4>
            <div className="text-sm text-gray-600 mt-1">
              Present: {Object.values(attendanceData).filter(a => a.status === "PRESENT").length} | 
              Absent: {Object.values(attendanceData).filter(a => a.status === "ABSENT").length} | 
              Late: {Object.values(attendanceData).filter(a => a.status === "LATE").length} | 
              Excused: {Object.values(attendanceData).filter(a => a.status === "EXCUSED").length}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || students.length === 0}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                {hasExistingAttendance ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                ✅ {hasExistingAttendance ? "Update Attendance" : "Submit Attendance"}
              </>
            )}
          </button>
        </div>

        {message && (
          <div className={`mt-3 p-3 rounded-md text-sm ${
            message.includes("✅") 
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* GUIDELINES */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📋 Attendance Guidelines</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• <strong>Present (✅):</strong> Student is in class and participating</div>
          <div>• <strong>Absent (❌):</strong> Student is not in class (add reason in notes)</div>
          <div>• <strong>Late (⏱):</strong> Student arrived late to class (specify arrival time in notes)</div>
          <div>• <strong>Excused (📝):</strong> Student has authorized absence (medical, family emergency, etc.)</div>
        </div>
        <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
          <strong>Note:</strong> You can only edit today's attendance. Historical records are locked for data integrity.
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendanceTaking;
