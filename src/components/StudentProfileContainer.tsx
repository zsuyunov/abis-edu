"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Phone, Mail, Calendar, MapPin, GraduationCap, BookOpen, Building, Edit2, Shield } from "lucide-react";
import StudentProfileUpdateModal from "./StudentProfileUpdateModal";

interface StudentProfileContainerProps {
  student: any;
}

const StudentProfileContainer = ({ student }: StudentProfileContainerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
                  {student.firstName?.[0]}{student.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{student.firstName} {student.lastName}</h2>
                  <p className="text-blue-100 flex items-center gap-2 mt-1">
                    <GraduationCap className="w-4 h-4" />
                    Student ID: {student.studentId}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Update Profile
              </motion.button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoCard
                icon={<User className="w-5 h-5 text-gray-600" />}
                label="First Name"
                value={student.firstName}
              />
              <InfoCard
                icon={<User className="w-5 h-5 text-gray-600" />}
                label="Last Name"
                value={student.lastName}
              />
              <InfoCard
                icon={<GraduationCap className="w-5 h-5 text-gray-600" />}
                label="Student ID"
                value={student.studentId || "Not provided"}
              />
              <InfoCard
                icon={<Phone className="w-5 h-5 text-gray-600" />}
                label="Phone Number"
                value={student.phone || "Not provided"}
                isEditable
              />
              <InfoCard
                icon={<Calendar className="w-5 h-5 text-gray-600" />}
                label="Date of Birth"
                value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "Not provided"}
              />
              <InfoCard
                icon={<User className="w-5 h-5 text-gray-600" />}
                label="Gender"
                value={student.gender || "Not provided"}
              />
              <InfoCard
                icon={<MapPin className="w-5 h-5 text-gray-600" />}
                label="Address"
                value={student.address || "Not provided"}
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className="p-6 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Academic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoCard
                icon={<GraduationCap className="w-5 h-5 text-gray-600" />}
                label="Class"
                value={student.class?.name || "Not assigned"}
              />
              <InfoCard
                icon={<Building className="w-5 h-5 text-gray-600" />}
                label="Branch"
                value={student.branch?.shortName || "Not assigned"}
              />
              <InfoCard
                icon={<Calendar className="w-5 h-5 text-gray-600" />}
                label="Academic Year"
                value={student.class?.academicYear?.name || "Not assigned"}
              />
              <InfoCard
                icon={<Calendar className="w-5 h-5 text-gray-600" />}
                label="Enrollment Date"
                value={student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : "Not provided"}
              />
            </div>
          </div>

          {/* Security Information */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Security
            </h3>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Password Protection</p>
                  <p className="text-xs text-purple-700 mt-1">
                    Click "Update Profile" to change your password and keep your account secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Profile Update Modal */}
      <StudentProfileUpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        studentId={student.id}
        currentPhone={student.phone || ""}
        onUpdateSuccess={() => {
          // Refresh the page to show updated data
          window.location.reload();
        }}
      />
    </>
  );
};

// InfoCard Component
const InfoCard = ({ icon, label, value, isEditable = false }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditable?: boolean;
}) => {
  return (
    <div className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm font-semibold text-gray-900">{value}</p>
          {isEditable && (
            <span className="text-xs text-blue-600 font-medium">Editable</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfileContainer;

