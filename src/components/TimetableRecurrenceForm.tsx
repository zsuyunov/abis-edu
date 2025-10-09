"use client";

import React, { useState, useEffect } from "react";
import { csrfFetch } from '@/hooks/useCsrfToken';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  X,
  Save,
  Repeat,
  Calendar,
  Clock,
  Plus,
  Trash2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface TimetableRecurrenceFormProps {
  relatedData?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

interface WeekdaySchedule {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface RecurrenceFormData {
  branchId: string;
  classId: string;
  academicYearId: string;
  subjectIds: string[];
  teacherIds: string[];
  startDate: string;
  endDate: string;
  roomNumber: string;
  buildingName: string;
  status: "ACTIVE" | "INACTIVE";
  weekdaySchedules: WeekdaySchedule[];
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

const TimetableRecurrenceForm: React.FC<TimetableRecurrenceFormProps> = ({
  relatedData,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<RecurrenceFormData>({
    branchId: "",
    classId: "",
    academicYearId: "",
    subjectIds: [],
    teacherIds: [],
    startDate: "",
    endDate: "",
    roomNumber: "",
    buildingName: "",
    status: "ACTIVE",
    weekdaySchedules: DAYS_OF_WEEK.map(day => ({
      day: day.value,
      startTime: "",
      endTime: "",
      enabled: false
    }))
  });

  const [loading, setLoading] = useState(false);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Reset form when component mounts
  React.useEffect(() => {
    setFormData({
      branchId: "",
      classId: "",
      academicYearId: "",
      subjectIds: [],
      teacherIds: [],
      startDate: "",
      endDate: "",
      roomNumber: "",
      buildingName: "",
      status: "ACTIVE",
      weekdaySchedules: DAYS_OF_WEEK.map(day => ({
        day: day.value,
        startTime: "",
        endTime: "",
        enabled: false
      }))
    });
  }, []);

  // Initialize filtered teachers when relatedData changes
  useEffect(() => {
    setFilteredTeachers(relatedData?.teachers || []);
  }, [relatedData?.teachers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const enabledSchedules = formData.weekdaySchedules.filter(schedule => schedule.enabled);
    
    if (!formData.branchId || !formData.classId || !formData.academicYearId || 
        formData.subjectIds.length === 0 || formData.teacherIds.length === 0 || !formData.startDate || 
        !formData.endDate || !formData.roomNumber || enabledSchedules.length === 0) {
      toast.error("Please fill in all required fields and enable at least one day");
      return;
    }

    // Validate that enabled schedules have times
    const invalidSchedules = enabledSchedules.filter(schedule => !schedule.startTime || !schedule.endTime);
    if (invalidSchedules.length > 0) {
      toast.error("Please set start and end times for all enabled days");
      return;
    }

    setLoading(true);

    try {
      const response = await csrfFetch("/api/timetable-templates/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branchId: parseInt(formData.branchId),
          classId: parseInt(formData.classId),
          academicYearId: parseInt(formData.academicYearId),
          subjectIds: formData.subjectIds.map(id => parseInt(id)),
          teacherIds: formData.teacherIds,
          startDate: formData.startDate,
          endDate: formData.endDate,
          roomNumber: formData.roomNumber,
          buildingName: formData.buildingName,
          status: formData.status,
          weekdaySchedules: enabledSchedules
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${result.count} timetable entries created successfully`);
        onSave(result);
        onClose();
      } else {
        throw new Error("Failed to create recurring timetables");
      }
    } catch (error) {
      console.error("Error creating recurring timetables:", error);
      toast.error("Failed to create recurring timetables");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RecurrenceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchTeachersForSubjects = async (subjectIds: string[], classId: string, academicYearId: string) => {
    if (subjectIds.length === 0) {
      setFilteredTeachers(relatedData?.teachers || []);
      return;
    }

    try {
      const response = await csrfFetch(`/api/teachers/by-subjects?subjectIds=${subjectIds.join(',')}&classId=${classId}&academicYearId=${academicYearId}`);
      if (response.ok) {
        const data = await response.json();
        setFilteredTeachers(data);
      } else {
        setFilteredTeachers(relatedData?.teachers || []); // Fallback to all teachers
      }
    } catch (error) {
      console.error('Error fetching teachers for subjects:', error);
      setFilteredTeachers(relatedData?.teachers || []); // Fallback to all teachers
    }
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    const newSubjectIds = checked 
      ? [...formData.subjectIds, subjectId]
      : formData.subjectIds.filter(id => id !== subjectId);
    
    setFormData(prev => ({
      ...prev,
      subjectIds: newSubjectIds,
      teacherIds: [] // Reset teachers when subjects change
    }));

    // Filter teachers based on selected subjects
    if (formData.branchId && formData.classId && formData.academicYearId) {
      fetchTeachersForSubjects(newSubjectIds, formData.classId, formData.academicYearId);
    }
  };

  const handleTeacherChange = (teacherId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      teacherIds: checked 
        ? [...prev.teacherIds, teacherId]
        : prev.teacherIds.filter(id => id !== teacherId)
    }));
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Refresh subjects and teachers from relatedData
      // This would typically involve calling parent component's refresh function
      // For now, we'll just re-filter teachers based on current subjects
      if (formData.subjectIds.length > 0 && formData.branchId && formData.classId && formData.academicYearId) {
        await fetchTeachersForSubjects(formData.subjectIds, formData.classId, formData.academicYearId);
      }
      setFilteredTeachers(relatedData?.teachers || []);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleDay = (dayValue: string) => {
    setFormData(prev => ({
      ...prev,
      weekdaySchedules: prev.weekdaySchedules.map(schedule => 
        schedule.day === dayValue 
          ? { ...schedule, enabled: !schedule.enabled }
          : schedule
      )
    }));
  };

  const updateScheduleTime = (dayValue: string, field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      weekdaySchedules: prev.weekdaySchedules.map(schedule => 
        schedule.day === dayValue 
          ? { ...schedule, [field]: value }
          : schedule
      )
    }));
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Create Recurring Timetables</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={refreshing}
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              </div>

              <div className="space-y-2">
                <Label>Teachers * (Select one or more)</Label>
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
                        <span>{teacher.firstName} {teacher.lastName}</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      {formData.subjectIds.length === 0 
                        ? "Please select subjects first" 
                        : "No teachers assigned to selected subjects"}
                    </div>
                  )}
                </div>
                {formData.teacherIds.length > 0 && (
                  <div className="text-xs text-gray-600">
                    Selected: {formData.teacherIds.length} teacher(s)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    type="date"
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Schedule</CardTitle>
              <p className="text-sm text-gray-600">
                Select days and set different times for each day. Click the day badges to enable/disable them.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Individual Day Settings */}
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const schedule = formData.weekdaySchedules.find(s => s.day === day.value);
                  return (
                    <div key={day.value} className={`p-4 border rounded-lg ${schedule?.enabled ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={schedule?.enabled ? "default" : "outline"}
                            className="cursor-pointer px-3 py-1 min-w-[60px] justify-center"
                            onClick={() => toggleDay(day.value)}
                          >
                            {day.short}
                          </Badge>
                          <span className="font-medium text-sm">{day.label}</span>
                        </div>
                        
                        {schedule?.enabled && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Start:</Label>
                              <Input
                                type="time"
                                value={schedule.startTime}
                                onChange={(e) => updateScheduleTime(day.value, 'startTime', e.target.value)}
                                className="h-8 w-24 text-xs"
                              />
                            </div>
                            <span className="text-xs text-gray-500">to</span>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">End:</Label>
                              <Input
                                type="time"
                                value={schedule.endTime}
                                onChange={(e) => updateScheduleTime(day.value, 'endTime', e.target.value)}
                                className="h-8 w-24 text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create Recurring Timetables"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimetableRecurrenceForm;