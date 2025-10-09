"use client";

import { motion } from "framer-motion";
import StudentGradeGrid from "./StudentGradeGrid";

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
      {/* Grade Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <StudentGradeGrid studentId={studentId} />
      </motion.div>
    </motion.div>
  );
};

export default StudentGradeContainer;
