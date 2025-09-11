"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator"; // Commented out as it doesn't exist
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Repeat,
  Plus,
  Edit,
  Trash2,
  Play,
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  Building,
  Users,
  GraduationCap,
  Sparkles,
  Zap,
  Settings,
  Target,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface TimetableTemplate {
  id: number;
  name: string;
  description: string;
  branchId: number;
  classId: number;
  academicYearId: number;
  subjectId: number;
  teacherId: string;
  day: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName: string;
  recurrenceType: "DAILY" | "WEEKLY" | "MONTHLY";
  recurrenceEnd: string;
  recurrenceDays: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RelatedData {
  branches: Array<{ id: number; shortName: string; legalName: string }>;
  classes: Array<{ id: number; name: string; branchId: number; academicYearId: number }>;
  academicYears: Array<{ id: number; name: string; startDate: string; endDate: string; status: string }>;
  subjects: Array<{ id: number; name: string; status: string }>;
  teachers: Array<{ id: string; firstName: string; lastName: string; branchId: number; status: string }>;
}

interface ModernTemplateManagerProps {
  relatedData: RelatedData | null;
}

const DAYS_OF_WEEK = [
  { value: "MONDAY", label: "Monday", short: "Mon" },
  { value: "TUESDAY", label: "Tuesday", short: "Tue" },
  { value: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { value: "THURSDAY", label: "Thursday", short: "Thu" },
  { value: "FRIDAY", label: "Friday", short: "Fri" },
  { value: "SATURDAY", label: "Saturday", short: "Sat" },
  { value: "SUNDAY", label: "Sunday", short: "Sun" }
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
];

const ModernTemplateManager: React.FC<ModernTemplateManagerProps> = ({ relatedData }) => {
  const [templates, setTemplates] = useState<TimetableTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TimetableTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    branchId: "",
    classId: "",
    academicYearId: "",
    subjectId: "",
    teacherId: "",
    day: "",
    startTime: "",
    endTime: "",
    roomNumber: "",
    buildingName: "",
    recurrenceType: "WEEKLY" as "DAILY" | "WEEKLY" | "MONTHLY",
    recurrenceEnd: "",
    recurrenceDays: [] as string[]
  });

  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (formData.branchId && relatedData?.classes) {
      const filtered = relatedData.classes.filter((cls: any) => 
        cls.branchId?.toString() === formData.branchId
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses([]);
    }
  }, [formData.branchId, relatedData?.classes]);

  useEffect(() => {
    if (formData.branchId && relatedData?.teachers) {
      const filtered = relatedData.teachers.filter((teacher: any) => 
        teacher.branchId?.toString() === formData.branchId && teacher.status === "ACTIVE"
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers([]);
    }
  }, [formData.branchId, relatedData?.teachers]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/timetable-templates", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      branchId: "",
      classId: "",
      academicYearId: "",
      subjectId: "",
      teacherId: "",
      day: "",
      startTime: "",
      endTime: "",
      roomNumber: "",
      buildingName: "",
      recurrenceType: "WEEKLY",
      recurrenceEnd: "",
      recurrenceDays: []
    });
    setErrors({});
    setEditingTemplate(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Template name is required";
    if (!formData.branchId) newErrors.branchId = "Branch is required";
    if (!formData.academicYearId) newErrors.academicYearId = "Academic year is required";
    if (!formData.classId) newErrors.classId = "Class is required";
    if (!formData.subjectId) newErrors.subjectId = "Subject is required";
    if (!formData.teacherId) newErrors.teacherId = "Teacher is required";
    if (!formData.startTime) newErrors.startTime = "Start time is required";
    if (!formData.endTime) newErrors.endTime = "End time is required";
    if (!formData.roomNumber.trim()) newErrors.roomNumber = "Room number is required";

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = "End time must be after start time";
    }

    if (formData.recurrenceType === "WEEKLY" && formData.recurrenceDays.length === 0) {
      newErrors.recurrenceDays = "Select at least one day for weekly recurrence";
    }

    if (!formData.recurrenceEnd) {
      newErrors.recurrenceEnd = "Recurrence end date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        branchId: parseInt(formData.branchId),
        classId: parseInt(formData.classId),
        academicYearId: parseInt(formData.academicYearId),
        subjectId: parseInt(formData.subjectId)
      };

      const response = await fetch("/api/timetable-templates", {
        method: editingTemplate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(editingTemplate ? { ...submitData, id: editingTemplate.id } : submitData)
      });

      if (response.ok) {
        toast.success(`Template ${editingTemplate ? "updated" : "created"} successfully!`);
        setShowForm(false);
        resetForm();
        fetchTemplates();
      } else {
        throw new Error("Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template: TimetableTemplate) => {
    setFormData({
      name: template.name,
      description: template.description,
      branchId: template.branchId.toString(),
      classId: template.classId.toString(),
      academicYearId: template.academicYearId.toString(),
      subjectId: template.subjectId.toString(),
      teacherId: template.teacherId,
      day: template.day,
      startTime: template.startTime,
      endTime: template.endTime,
      roomNumber: template.roomNumber,
      buildingName: template.buildingName || "",
      recurrenceType: template.recurrenceType,
      recurrenceEnd: template.recurrenceEnd,
      recurrenceDays: template.recurrenceDays || []
    });
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = async (template: TimetableTemplate) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/timetable-templates/${template.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.ok) {
        toast.success("Template deleted successfully!");
        fetchTemplates();
      } else {
        throw new Error("Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template. Please try again.");
    }
  };

  const toggleRecurrenceDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.includes(day)
        ? prev.recurrenceDays.filter(d => d !== day)
        : [...prev.recurrenceDays, day]
    }));
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Recurrence Templates
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            Create powerful recurring schedule templates for automatic timetable generation
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </CardTitle>
            <CardDescription>
              Configure recurring schedule patterns for automatic timetable generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    placeholder="e.g., Grade 10 Physics - Weekly"
                    className={`h-12 border-2 rounded-xl ${errors.name ? 'border-red-300' : 'border-gray-200'} focus:border-purple-500`}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Recurrence Type</Label>
                  <select 
                    value={formData.recurrenceType} 
                    onChange={(e) => updateFormData("recurrenceType", e.target.value as "DAILY" | "WEEKLY" | "MONTHLY")}
                    className="h-12 border-2 rounded-xl border-gray-200 focus:border-purple-500 w-full"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Brief description of this template..."
                    className="border-2 border-gray-200 rounded-xl focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-6" />

            {/* Academic Structure */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="w-4 h-4" />
                Academic Structure
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <select 
                    value={formData.branchId} 
                    onChange={(e) => updateFormData("branchId", e.target.value)}
                    className={`h-12 border-2 rounded-xl ${errors.branchId ? 'border-red-300' : 'border-gray-200'} focus:border-purple-500 w-full`}
                  >
                    <option value="">Select branch</option>
                    {relatedData?.branches?.map((branch: any) => (
                      <option key={branch.id} value={branch.id.toString()}>
                        {branch.shortName}
                      </option>
                    ))}
                  </select>
                  {errors.branchId && <p className="text-sm text-red-500">{errors.branchId}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Academic Year *</Label>
                  <select 
                    value={formData.academicYearId} 
                    onChange={(e) => updateFormData("academicYearId", e.target.value)}
                    className={`h-12 border-2 rounded-xl ${errors.academicYearId ? 'border-red-300' : 'border-gray-200'} focus:border-purple-500 w-full`}
                  >
                    <option value="">Select academic year</option>
                    {relatedData?.academicYears?.filter((year: any) => year.status === "ACTIVE").map((year: any) => (
                      <option key={year.id} value={year.id.toString()}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                  {errors.academicYearId && <p className="text-sm text-red-500">{errors.academicYearId}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Class *</Label>
                  <select 
                    value={formData.classId} 
                    onChange={(e) => updateFormData("classId", e.target.value)}
                    disabled={!formData.branchId}
                    className={`h-12 border-2 rounded-xl ${errors.classId ? 'border-red-300' : 'border-gray-200'} focus:border-purple-500 w-full`}
                  >
                    <option value="">{!formData.branchId ? "Select branch first" : "Select class"}</option>
                    {filteredClasses.map((cls: any) => (
                      <option key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  {errors.classId && <p className="text-sm text-red-500">{errors.classId}</p>}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-6" />

            {/* Subject & Teacher */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Subject & Teacher
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <select 
                    value={formData.subjectId} 
                    onChange={(e) => updateFormData("subjectId", e.target.value)}
                    className={`h-12 border-2 rounded-xl ${errors.subjectId ? 'border-red-300' : 'border-gray-200'} focus:border-purple-500 w-full`}
                  >
                    <option value="">Select subject</option>
                    {relatedData?.subjects?.filter((subject: any) => subject.status === "ACTIVE").map((subject: any) => (
                      <option key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  {errors.subjectId && <p className="text-sm text-red-500">{errors.subjectId}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Teacher *</Label>
                  <select 
                    value={formData.teacherId} 
                    onChange={(e) => updateFormData("teacherId", e.target.value)}
                    disabled={!formData.branchId}
                    className={`h-12 border-2 rounded-xl ${errors.teacherId ? 'border-red-300' : 'border-gray-200'} focus:border-purple-500 w-full`}
                  >
                    <option value="">{!formData.branchId ? "Select branch first" : "Select teacher"}</option>
                    {filteredTeachers.map((teacher: any) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.teacherId && <p className="text-sm text-red-500">{errors.teacherId}</p>}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-6" />

            {/* Schedule & Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Schedule & Location
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <select 
                    value={formData.startTime} 
                    onChange={(e) => updateFormData("startTime", e.target.value)}
                    className={`h-12 border-2 rounded-xl ${errors.startTime ? 'border-red-300' : 'border-gray-200'} focus:border-purple-500 w-full`}
                  >
                    <option value="">Select start time</option>
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
                </div>

                <div className="space-y-2">
                  <Label>End Time *</Label>
                  <select 
                    value={formData.endTime} 
                    onChange={(e) => updateFormData("endTime", e.target.value)}
                    className={`h-12 border-2 rounded-xl ${errors.endTime ? 'border-red-300' : 'border-gray-200'} focus:border-purple-500 w-full`}
                  >
                    <option value="">Select end time</option>
                    {TIME_SLOTS.filter(time => !formData.startTime || time > formData.startTime).map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Room Number *</Label>
                  <Input
                    value={formData.roomNumber}
                    onChange={(e) => updateFormData("roomNumber", e.target.value)}
                    placeholder="e.g., 204, Lab A"
                    className={`h-12 border-2 rounded-xl ${errors.roomNumber ? 'border-red-300' : 'border-gray-200'} focus:border-purple-500`}
                  />
                  {errors.roomNumber && <p className="text-sm text-red-500">{errors.roomNumber}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Building Name</Label>
                  <Input
                    value={formData.buildingName}
                    onChange={(e) => updateFormData("buildingName", e.target.value)}
                    placeholder="e.g., Main Building"
                    className="h-12 border-2 rounded-xl border-gray-200 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-6" />

            {/* Recurrence Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Recurrence Settings
              </h3>

              {formData.recurrenceType === "WEEKLY" && (
                <div className="space-y-2">
                  <Label>Select Days *</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={formData.recurrenceDays.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        className="h-16 rounded-xl flex flex-col"
                        onClick={() => toggleRecurrenceDay(day.value)}
                      >
                        <div className="text-xs font-bold">{day.short}</div>
                        <div className="text-xs">{day.label.substring(0, 3)}</div>
                      </Button>
                    ))}
                  </div>
                  {errors.recurrenceDays && <p className="text-sm text-red-500">{errors.recurrenceDays}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label>Recurrence End Date *</Label>
                <Input
                  type="date"
                  value={formData.recurrenceEnd}
                  onChange={(e) => updateFormData("recurrenceEnd", e.target.value)}
                  className={`h-12 border-2 rounded-xl ${errors.recurrenceEnd ? 'border-red-300' : 'border-gray-200'} focus:border-purple-500`}
                />
                {errors.recurrenceEnd && <p className="text-sm text-red-500">{errors.recurrenceEnd}</p>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    {editingTemplate ? "Update Template" : "Create Template"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(templates) && templates.length > 0 ? templates.map((template) => (
          <Card key={template.id} className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-purple-300 bg-gradient-to-br from-white to-purple-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(template)}
                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 active:scale-95"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 transition-all duration-200 active:scale-95"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(template)}
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-all duration-200 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span>
                    {relatedData?.subjects?.find((s: any) => s.id === template.subjectId)?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-500" />
                  <span>
                    {(() => {
                      const teacher = relatedData?.teachers?.find((t: any) => t.id === template.teacherId);
                      return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher not found';
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span>{template.startTime} - {template.endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <span>
                    Room {template.roomNumber}
                    {template.buildingName && `, ${template.buildingName}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-indigo-500" />
                  <span className="capitalize">{template.recurrenceType.toLowerCase()}</span>
                  {template.recurrenceType === "WEEKLY" && template.recurrenceDays?.length > 0 && (
                    <div className="flex gap-1">
                      {template.recurrenceDays.map(day => {
                        const dayInfo = DAYS_OF_WEEK.find(d => d.value === day);
                        return (
                          <Badge key={day} variant="outline" className="text-xs px-1">
                            {dayInfo?.short}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(template.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Repeat className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">Create your first timetable template to get started</p>
            <Button 
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernTemplateManager;
