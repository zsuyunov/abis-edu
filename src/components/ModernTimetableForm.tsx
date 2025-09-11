"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  X,
  Save,
  Calendar,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface ModernTimetableFormProps {
  type: "create" | "update";
  data?: any;
  relatedData?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

interface FormData {
  branchId: string;
  classId: string;
  academicYearId: string;
  subjectId: string;
  teacherId: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName: string;
  status: "ACTIVE" | "INACTIVE";
}

const DAYS_OF_WEEK = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" }
];

const ModernTimetableForm: React.FC<ModernTimetableFormProps> = ({
  type,
  data,
  relatedData,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<FormData>({
    branchId: "",
    classId: "",
    academicYearId: "",
    subjectId: "",
    teacherId: "",
    date: "",
    day: "",
    startTime: "",
    endTime: "",
    roomNumber: "",
    buildingName: "",
    status: "ACTIVE"
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (type === "update" && data) {
      setFormData({
        branchId: data.branchId?.toString() || "",
        classId: data.classId?.toString() || "",
        academicYearId: data.academicYearId?.toString() || "",
        subjectId: data.subjectId?.toString() || "",
        teacherId: data.teacherId || "",
        date: data.fullDate ? new Date(data.fullDate).toISOString().split('T')[0] : "",
        day: data.day || "",
        startTime: data.startTime ? new Date(data.startTime).toTimeString().slice(0, 5) : "",
        endTime: data.endTime ? new Date(data.endTime).toTimeString().slice(0, 5) : "",
        roomNumber: data.roomNumber || "",
        buildingName: data.buildingName || "",
        status: data.status || "ACTIVE"
      });
    } else {
      // Always reset form for create mode or when no data
      setFormData({
        branchId: "",
        classId: "",
        academicYearId: "",
        subjectId: "",
        teacherId: "",
        date: "",
        day: "",
        startTime: "",
        endTime: "",
        roomNumber: "",
        buildingName: "",
        status: "ACTIVE"
      });
    }
  }, [type, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.branchId || !formData.classId || !formData.academicYearId || 
        !formData.subjectId || !formData.teacherId || !formData.date || 
        !formData.startTime || !formData.endTime || !formData.roomNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        branchId: parseInt(formData.branchId),
        classId: parseInt(formData.classId),
        academicYearId: parseInt(formData.academicYearId),
        subjectId: parseInt(formData.subjectId),
        teacherId: formData.teacherId,
        fullDate: formData.date,
        day: formData.day,
        startTime: `${formData.date}T${formData.startTime}:00`,
        endTime: `${formData.date}T${formData.endTime}:00`,
        roomNumber: formData.roomNumber,
        buildingName: formData.buildingName,
        status: formData.status
      };

      const response = await fetch(`/api/timetables${type === "update" ? `/${data.id}` : ""}`, {
        method: type === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast.success(`Timetable ${type === "create" ? "created" : "updated"} successfully`);
        onSave(submitData);
      onClose();
      } else {
        throw new Error("Failed to save timetable");
      }
    } catch (error) {
      console.error("Error saving timetable:", error);
      toast.error("Failed to save timetable");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {type === "create" ? "Create New Timetable" : "Edit Timetable"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
            </Button>
          </div>
          
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Branch & Academic Year */}
          <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
              <Label htmlFor="branchId">Branch *</Label>
              <select 
                    value={formData.branchId} 
                onChange={(e) => handleInputChange("branchId", e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm"
                  >
                <option value="">Select branch</option>
                      {relatedData?.branches?.map((branch: any) => (
                  <option key={branch.id} value={branch.id.toString()}>
                    {branch.shortName}
                  </option>
                ))}
              </select>
                </div>

                <div className="space-y-2">
              <Label htmlFor="academicYearId">Academic Year *</Label>
              <select 
                    value={formData.academicYearId} 
                onChange={(e) => handleInputChange("academicYearId", e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select year</option>
                {relatedData?.academicYears?.map((year: any) => (
                  <option key={year.id} value={year.id.toString()}>
                    {year.name}
                  </option>
                ))}
              </select>
                </div>
              </div>

          {/* Class & Subject */}
          <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
              <Label htmlFor="classId">Class *</Label>
              <select 
                value={formData.classId} 
                onChange={(e) => handleInputChange("classId", e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select class</option>
                {relatedData?.classes?.map((cls: any) => (
                  <option key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </option>
                ))}
              </select>
                </div>

                <div className="space-y-2">
              <Label htmlFor="subjectId">Subject *</Label>
              <select 
                value={formData.subjectId} 
                onChange={(e) => handleInputChange("subjectId", e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select subject</option>
                {relatedData?.subjects?.map((subject: any) => (
                  <option key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </option>
                ))}
              </select>
                </div>
              </div>

          {/* Teacher & Day */}
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
              <Label htmlFor="teacherId">Teacher *</Label>
              <select 
                value={formData.teacherId} 
                onChange={(e) => handleInputChange("teacherId", e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select teacher</option>
                {relatedData?.teachers?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
                </div>

                <div className="space-y-2">
              <Label htmlFor="day">Day *</Label>
              <select 
                value={formData.day}
                onChange={(e) => handleInputChange("day", e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select day</option>
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
                        </div>
                        </div>

          {/* Date */}
                <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="h-9"
            />
                </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                type="time"
                id="startTime"
                    value={formData.startTime} 
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                className="h-9"
              />
                </div>

                <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
                  <Input
                type="time"
                id="endTime"
                    value={formData.endTime} 
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                className="h-9"
                  />
                          </div>
                </div>

          {/* Room & Building */}
          <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
              <Label htmlFor="roomNumber">Room *</Label>
                  <Input
                id="roomNumber"
                    value={formData.roomNumber}
                onChange={(e) => handleInputChange("roomNumber", e.target.value)}
                placeholder="Room number"
                className="h-9"
              />
                </div>

                <div className="space-y-2">
              <Label htmlFor="buildingName">Building</Label>
                  <Input
                id="buildingName"
                    value={formData.buildingName}
                onChange={(e) => handleInputChange("buildingName", e.target.value)}
                placeholder="Building name"
                className="h-9"
                  />
                </div>
              </div>

          {/* Status */}
                  <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select 
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value as any)}
              className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
                  </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
                          </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : type === "create" ? "Create" : "Update"}
                        </Button>
                  </div>
        </form>
          </div>
    </div>
  );
};

export default ModernTimetableForm;
