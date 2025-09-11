"use client";

import { motion } from "framer-motion";
import StudentAttendanceGrid from "./StudentAttendanceGrid";
import { Calendar, TrendingUp, Award } from "lucide-react";

interface StudentAttendanceContainerProps {
  studentId: string;
}

const StudentAttendanceContainer = ({ studentId }: StudentAttendanceContainerProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Attendance</h1>
            <p className="text-sm text-gray-600">Track your attendance patterns and progress</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">This Week</span>
            </div>
            <p className="text-lg font-bold text-green-900 mt-1">95%</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3 border border-blue-100"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">This Month</span>
            </div>
            <p className="text-lg font-bold text-blue-900 mt-1">92%</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-3 border border-purple-100"
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Streak</span>
            </div>
            <p className="text-lg font-bold text-purple-900 mt-1">12 days</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Attendance Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <StudentAttendanceGrid studentId={studentId} />
      </motion.div>
    </motion.div>
  );
};

export default StudentAttendanceContainer;
