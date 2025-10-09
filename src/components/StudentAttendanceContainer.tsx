"use client";

import { motion } from "framer-motion";
import StudentAttendanceGrid from "./StudentAttendanceGrid";

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
      {/* Attendance Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <StudentAttendanceGrid studentId={studentId} />
      </motion.div>
    </motion.div>
  );
};

export default StudentAttendanceContainer;
