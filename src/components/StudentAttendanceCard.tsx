"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StudentAttendanceCardProps {
  id: string;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  percentage: number;
}

const StudentAttendanceCard = ({ id }: StudentAttendanceCardProps) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceStats();
  }, [id]);

  const fetchAttendanceStats = async () => {
    try {
      const response = await fetch(`/api/student-attendance?studentId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <span className="text-sm text-gray-500">Loading...</span>;
  }

  if (!stats) {
    return <span className="text-sm text-gray-500">No data</span>;
  }

  return (
    <div className="flex flex-col">
      <h1 className="text-xl font-semibold">{stats.percentage}%</h1>
      <span className="text-sm text-gray-400">
        {stats.presentDays}/{stats.totalDays} {t('attendance.present')}
      </span>
    </div>
  );
};

export default StudentAttendanceCard;
