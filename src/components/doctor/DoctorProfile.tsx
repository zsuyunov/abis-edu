/*
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  User, 
  Edit, 
  Save,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Award
} from "lucide-react";

interface DoctorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  position: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  education?: string;
  certifications?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  profileImage?: string;
  joinedAt: string;
}

interface DoctorProfileProps {
  userId: string;
}

const DoctorProfile = ({ userId }: DoctorProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<DoctorProfile>>({});
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<DoctorProfile>({
    queryKey: ["doctor-profile", userId],
    queryFn: async () => {
      const response = await fetch(`/api/doctor/profile/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: Partial<DoctorProfile>) => {
      const response = await fetch(`/api/doctor/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-profile", userId] });
      setIsEditing(false);
      setFormData({});
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(profile || {});
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="h-4 bg-gray-200 rounded mb-3 w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header }
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medical Profile</h1>
            <p className="text-gray-600">Manage your professional information</p>
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Profile Header }
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
            </div>
            {isEditing && (
              <button className="absolute -bottom-2 -right-2 p-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition-colors">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Dr. {profile.firstName} {profile.lastName}
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                <span>{profile.position}</span>
              </div>
              {profile.specialization && (
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>{profile.specialization}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information }
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.firstName || ""}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastName || ""}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.lastName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">
                  {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not provided"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information }
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                {profile.email}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {profile.phone || "Not provided"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              {isEditing ? (
                <textarea
                  value={formData.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  {profile.address || "Not provided"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Professional Information }
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Professional Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.specialization || ""}
                  onChange={(e) => handleInputChange("specialization", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.specialization || "Not specified"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.licenseNumber || ""}
                  onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.licenseNumber || "Not provided"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.yearsOfExperience || ""}
                  onChange={(e) => handleInputChange("yearsOfExperience", parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.yearsOfExperience || "Not specified"} years</p>
              )}
            </div>
          </div>
        </div>

        {/* Education & Certifications }
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Education & Certifications
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
              {isEditing ? (
                <textarea
                  value={formData.education || ""}
                  onChange={(e) => handleInputChange("education", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.education || "Not provided"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
              {isEditing ? (
                <textarea
                  value={formData.certifications?.join(", ") || ""}
                  onChange={(e) => handleInputChange("certifications", e.target.value.split(", "))}
                  rows={2}
                  placeholder="Enter certifications separated by commas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <div className="space-y-1">
                  {profile.certifications && profile.certifications.length > 0 ? (
                    profile.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-green-600" />
                        <span className="text-gray-900">{cert}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-900">No certifications listed</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;

*/