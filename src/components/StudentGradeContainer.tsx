"use client";

import { motion } from "framer-motion";
import StudentGradeGrid from "./StudentGradeGrid";
import { GraduationCap, TrendingUp, Target, Star } from "lucide-react";

interface StudentGradeContainerProps {
  studentId: string;
}

const StudentGradeContainer = ({ studentId }: StudentGradeContainerProps) => {
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
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Grades</h1>
            <p className="text-sm text-gray-600">Monitor your academic performance and progress</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Overall</span>
            </div>
            <p className="text-lg font-bold text-emerald-900 mt-1">87%</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3 border border-blue-100"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">This Month</span>
            </div>
            <p className="text-lg font-bold text-blue-900 mt-1">89%</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-100"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">Best</span>
            </div>
            <p className="text-lg font-bold text-amber-900 mt-1">98%</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-3 border border-rose-100"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-medium text-rose-700">Rank</span>
            </div>
            <p className="text-lg font-bold text-rose-900 mt-1">#5</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Grade Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <StudentGradeGrid studentId={studentId} />
      </motion.div>
    </motion.div>
  );
};

export default StudentGradeContainer;
