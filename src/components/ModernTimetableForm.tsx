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
  Clock,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface ModernTimetableFormProps {
  type: "create" | "update";
  data?: any;
  relatedData?: any;
  onClose: () => void;
  onSave: (data: any) => void;
  onRefresh?: () => void;
}

interface FormData {
  branchId: string;
  classId: string;
  academicYearId: string;
  subjectIds: string[];
  teacherIds: string[];
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
  onSave,
  onRefresh
}) => {
  const [formData, setFormData] = useState<FormData>({
    branchId: "",
    classId: "",
    academicYearId: "",
    subjectIds: [],
    teacherIds: [],
    date: "",
    day: "",
    startTime: "",
    endTime: "",
    roomNumber: "",
    buildingName: "",
    status: "ACTIVE"
  });

  const [loading, setLoading] = useState(false);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (type === "update" && data) {
      setFormData({
        branchId: data.branchId?.toString() || "",
        classId: data.classId?.toString() || "",
        academicYearId: data.academicYearId?.toString() || "",
        subjectIds: data.subjectId ? [data.subjectId.toString()] : [],
        teacherIds: data.teacherIds ? (Array.isArray(data.teacherIds) ? data.teacherIds : [data.teacherIds]) : [],
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
        subjectIds: [],
        teacherIds: [],
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

  // Initialize filteredTeachers with all teachers
  useEffect(() => {
    if (relatedData?.teachers && relatedData.teachers.length > 0) {
      console.log('📝 Initializing filteredTeachers with all teachers:', relatedData.teachers.length);
      setFilteredTeachers(relatedData.teachers);
    }
  }, [relatedData?.teachers]);

  // Filter teachers based on selected subjects
  useEffect(() => {
    console.log('🔍 Filtering teachers for subjects:', {
      subjectIds: formData.subjectIds,
      classId: formData.classId,
      academicYearId: formData.academicYearId,
      hasRelatedData: !!relatedData?.teachers
    });

    if (formData.subjectIds.length > 0 && formData.classId && formData.academicYearId) {
      // Fetch teachers assigned to the selected subjects
      const fetchTeachersForSubjects = async () => {
        try {
          const url = `/api/teachers/by-subjects?subjectIds=${formData.subjectIds.join(',')}&classId=${formData.classId}&academicYearId=${formData.academicYearId}`;
          console.log('🌐 Fetching teachers from:', url);

          const response = await fetch(url);
          console.log('📡 Response status:', response.status);

          if (response.ok) {
            const teachers = await response.json();
            console.log('👥 Teachers found:', teachers.length);
            setFilteredTeachers(teachers.length > 0 ? teachers : relatedData?.teachers || []);
          } else {
            const errorText = await response.text();
            console.error('❌ API error:', response.status, errorText);
            // Fallback to all teachers if API fails
            setFilteredTeachers(relatedData?.teachers || []);
          }
        } catch (error) {
          console.error('❌ Error fetching teachers for subjects:', error);
          setFilteredTeachers(relatedData?.teachers || []);
        }
      };

      fetchTeachersForSubjects();
    } else {
      console.log('⚠️ Missing required data or no subjects selected, showing all teachers');
      setFilteredTeachers(relatedData?.teachers || []);
    }
  }, [formData.subjectIds, formData.classId, formData.academicYearId, relatedData?.teachers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.branchId || !formData.classId || !formData.academicYearId || 
        formData.subjectIds.length === 0 || formData.teacherIds.length === 0 || !formData.date || 
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
        subjectIds: formData.subjectIds.map(id => parseInt(id)),
        teacherIds: formData.teacherIds,
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
        
        // Refresh data to get any new subjects/teachers
        if (onRefresh) {
          await onRefresh();
        }
        
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

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    console.log('📚 Subject changed:', { subjectId, checked });
    setFormData(prev => {
      const newSubjectIds = checked 
        ? [...prev.subjectIds, subjectId]
        : prev.subjectIds.filter(id => id !== subjectId);
      
      console.log('📚 New subject IDs:', newSubjectIds);
      
      return {
        ...prev,
        subjectIds: newSubjectIds,
        teacherIds: [] // Reset teachers when subjects change
      };
    });
  };

  const handleTeacherChange = (teacherId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      teacherIds: checked 
        ? [...prev.teacherIds, teacherId]
        : prev.teacherIds.filter(id => id !== teacherId)
    }));
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
        toast.success('Data refreshed successfully!');
      } catch (error) {
        toast.error('Failed to refresh data');
      } finally {
        setRefreshing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {type === "create" ? "Create New Timetable" : "Edit Timetable"}
          </h2>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
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

          {/* Class */}
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

          {/* Subjects - Multi-select */}
          <div className="space-y-2">
            <Label>Subjects * (Select one or more)</Label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
              {relatedData?.subjects?.map((subject: any) => (
                <label key={subject.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.subjectIds.includes(subject.id.toString())}
                    onChange={(e) => handleSubjectChange(subject.id.toString(), e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>{subject.name}</span>
                </label>
              ))}
            </div>
            {formData.subjectIds.length > 0 && (
              <div className="text-xs text-gray-600">
                Selected: {formData.subjectIds.length} subject(s)
              </div>
            )}
          </div>

          {/* Teachers - Multi-select */}
          <div className="space-y-2">
            <Label>
              Teachers * (Select one or more)
              {formData.subjectIds.length > 0 && formData.classId && formData.academicYearId && (
                <span className="ml-2 text-xs text-blue-600 font-normal">
                  (Filtered by selected subjects)
                </span>
              )}
              {formData.subjectIds.length > 0 && (!formData.classId || !formData.academicYearId) && (
                <span className="ml-2 text-xs text-orange-600 font-normal">
                  (Select class and academic year to filter)
                </span>
              )}
            </Label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher: any) => (
                  <label key={teacher.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.teacherIds.includes(teacher.id)}
                      onChange={(e) => handleTeacherChange(teacher.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span>{teacher.firstName} {teacher.lastName} ({teacher.teacherId})</span>
                  </label>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">
                  {formData.subjectIds.length === 0
                    ? "Please select subjects first"
                    : formData.subjectIds.length > 0 && formData.classId && formData.academicYearId
                    ? "No teachers assigned to selected subjects"
                    : "Select class and academic year to see teachers"}
                </div>
              )}
            </div>
            {formData.teacherIds.length > 0 && (
              <div className="text-xs text-gray-600">
                Selected: {formData.teacherIds.length} teacher(s)
              </div>
            )}
          </div>

          {/* Day */}
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
