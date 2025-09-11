/*
"use client";

import { useState, useEffect } from "react";

interface ParentAttendanceContainerProps {
  parentId: string;
}

const ParentAttendanceContainer = ({ parentId }: ParentAttendanceContainerProps) => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string>("");

  useEffect(() => {
    fetchAttendanceData();
  }, [parentId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/parent/attendance?parentId=${parentId}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.attendance || []);
        if (data.children && data.children.length > 0) {
          setSelectedChild(data.children[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const children = attendanceData.reduce((acc, record) => {
    if (!acc.find(child => child.id === record.studentId)) {
      acc.push({
        id: record.studentId,
        name: record.studentName,
        class: record.className
      });
    }
    return acc;
  }, [] as any[]);

  const selectedChildData = attendanceData.filter(record => record.studentId === selectedChild);

  const calculateStats = (data: any[]) => {
    const presentDays = data.filter(record => record.status === 'PRESENT').length;
    const absentDays = data.filter(record => record.status === 'ABSENT').length;
    const totalDays = data.length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    return { presentDays, absentDays, totalDays, attendanceRate };
  };

  const stats = calculateStats(selectedChildData);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header }
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Children's Attendance</h2>
        
        {children.length > 0 && (
          <div className="flex space-x-2 mb-4">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedChild === child.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {child.name} ({child.class})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Stats }
      {selectedChildData.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Overview</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.presentDays}</div>
              <div className="text-sm text-gray-600">Present Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.absentDays}</div>
              <div className="text-sm text-gray-600">Absent Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.attendanceRate}%</div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{stats.totalDays}</div>
              <div className="text-sm text-gray-600">Total Days</div>
            </div>
          </div>

          {/* Progress Bar }
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Attendance</span>
              <span className="font-medium">{stats.attendanceRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  stats.attendanceRate >= 90 ? 'bg-green-500' :
                  stats.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${stats.attendanceRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-500">No attendance data available</p>
          </div>
        </div>
      )}

      {/* Recent Attendance }
      {selectedChildData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h3>
          <div className="space-y-2">
            {selectedChildData.slice(0, 10).map((record, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    record.status === 'PRESENT' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">{record.date}</span>
                </div>
                <span className={`text-sm font-medium ${
                  record.status === 'PRESENT' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentAttendanceContainer;

*/