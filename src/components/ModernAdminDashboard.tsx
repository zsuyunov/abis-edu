"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  UsersRound,
  UserCog,
  TrendingUp,
  TrendingDown,
  User
} from "lucide-react";

interface DashboardStats {
  teachers: {
    total: number;
    male: number;
    female: number;
    trend: 'up' | 'down';
    percentage: number;
  };
  students: {
    total: number;
    male: number;
    female: number;
    trend: 'up' | 'down';
    percentage: number;
  };
  parents: {
    total: number;
    trend: 'up' | 'down';
    percentage: number;
  };
  staff: {
    total: number;
    trend: 'up' | 'down';
    percentage: number;
  };
  classes: number;
  subjects: number;
  events: number;
}

const ModernAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ 
    title, 
    total, 
    icon: Icon, 
    bgColor,
    textColor = "text-white",
    genderBreakdown 
  }: {
    title: string;
    total: number;
    icon: any;
    bgColor: string;
    textColor?: string;
    genderBreakdown?: { male: number; female: number };
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.02 }}
      className={`relative overflow-hidden rounded-xl ${bgColor} p-6 shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-white/90 text-sm font-medium mb-1">{title}</h3>
          <p className="text-3xl font-bold text-white">{total.toLocaleString()}</p>
          <span className="text-white/70 text-xs mt-1">Total {title}</span>
        </div>
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-white/80" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-2xl h-40"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
      >
        <p className="text-red-600 font-medium">Error loading dashboard statistics</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Students"
          total={stats.students.total}
          icon={GraduationCap}
          bgColor="bg-gradient-to-r from-cyan-400 to-blue-500"
          textColor="text-white"
        />
        
        <StatCard
          title="Teachers"
          total={stats.teachers.total}
          icon={Users}
          bgColor="bg-gradient-to-r from-purple-400 to-purple-600"
          textColor="text-white"
        />
        
        <StatCard
          title="Parents"
          total={stats.parents.total}
          icon={UsersRound}
          bgColor="bg-gradient-to-r from-blue-400 to-blue-600"
          textColor="text-white"
        />
        
        <StatCard
          title="Staffs"
          total={stats.staff.total}
          icon={UserCog}
          bgColor="bg-gradient-to-r from-pink-400 to-purple-500"
          textColor="text-white"
        />
      </div>

    </div>
  );
};

export default ModernAdminDashboard;
