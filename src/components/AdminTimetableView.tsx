"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  Filter, 
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  CalendarDays,
  Repeat,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import FormModal from "./FormModal";
import ModernTimetableForm from "./ModernTimetableForm";
import TimetableRecurrenceForm from "./TimetableRecurrenceForm";
import TimetableBulkUpload from "./TimetableBulkUpload";

interface TimetableEntry {
  id: number;
  fullDate: string;
  day: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName?: string;
  status: string;
  // Optional top-level foreign keys (returned by API in many cases)
  branchId?: number;
  classId?: number;
  subjectId?: number;
  teacherId?: string;
  subject: { name: string };
  class: { name: string };
  teacher: { firstName: string; lastName: string };
  branch: { shortName: string; id?: number };
}

interface RelatedData {
  branches: Array<{ id: number; shortName: string; legalName: string }>;
  classes: Array<{ id: number; name: string; branchId: number; academicYearId: number }>;
  academicYears: Array<{ id: number; name: string; startDate: string; endDate: string; status: string }>;
  subjects: Array<{ id: number; name: string; status: string }>;
  teachers: Array<{ id: string; firstName: string; lastName: string; branchId: number; status: string }>;
}

interface AdminTimetableViewProps {
  role: string;
  currentUserId: string;
  relatedData: RelatedData | null;
}

const AdminTimetableView = ({ role, currentUserId, relatedData }: AdminTimetableViewProps) => {
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [filteredTimetables, setFilteredTimetables] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [branchIdFilter, setBranchIdFilter] = useState("");
  const [classIdFilter, setClassIdFilter] = useState("");
  const [subjectIdFilter, setSubjectIdFilter] = useState("");
  const [teacherIdFilter, setTeacherIdFilter] = useState("");
  const [academicYearIdFilter, setAcademicYearIdFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "year">("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [showRecurrenceForm, setShowRecurrenceForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  useEffect(() => {
    fetchTimetables();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [timetables, searchFilter, branchIdFilter, classIdFilter, subjectIdFilter, teacherIdFilter, academicYearIdFilter, dayFilter, statusFilter, viewMode, selectedDate]);

  const fetchTimetables = async () => {
    try {
      const response = await fetch("/api/timetables", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      setTimetables(data);
    } catch (error) {
      console.error("Failed to fetch timetables:", error);
      toast.error("Failed to fetch timetables");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...timetables];

    // Apply search filter
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.subject.name.toLowerCase().includes(searchLower) ||
        entry.class.name.toLowerCase().includes(searchLower) ||
        `${entry.teacher.firstName} ${entry.teacher.lastName}`.toLowerCase().includes(searchLower) ||
        entry.roomNumber.toLowerCase().includes(searchLower) ||
        entry.buildingName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply other filters
    if (branchIdFilter) {
      filtered = filtered.filter(entry => (entry.branchId ?? entry.branch?.id) === parseInt(branchIdFilter));
    }
    if (classIdFilter) {
      filtered = filtered.filter(entry => (entry.classId ?? (entry as any).class?.id) === parseInt(classIdFilter));
    }
    if (subjectIdFilter) {
      filtered = filtered.filter(entry => (entry.subjectId ?? (entry as any).subject?.id) === parseInt(subjectIdFilter));
    }
    if (teacherIdFilter) {
      filtered = filtered.filter(entry => (entry.teacherId ?? "") === teacherIdFilter);
    }
    if (academicYearIdFilter) {
      // This would need to be implemented based on your data structure
    }
    if (dayFilter) {
      filtered = filtered.filter(entry => entry.day === dayFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter(entry => entry.status === statusFilter);
    }

    // Apply date filtering based on view mode
    const now = new Date();
    const selected = new Date(selectedDate);

    switch (viewMode) {
      case "day":
        filtered = filtered.filter(entry => {
          const entryDate = new Date(entry.fullDate);
          return entryDate.toDateString() === selected.toDateString();
        });
        break;
      case "week":
        const weekStart = new Date(selected);
        weekStart.setDate(selected.getDate() - selected.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        filtered = filtered.filter(entry => {
          const entryDate = new Date(entry.fullDate);
          return entryDate >= weekStart && entryDate <= weekEnd;
        });
        break;
      case "month":
        const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
        const monthEnd = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        filtered = filtered.filter(entry => {
          const entryDate = new Date(entry.fullDate);
          return entryDate >= monthStart && entryDate <= monthEnd;
        });
        break;
      case "year":
        const yearStart = new Date(selected.getFullYear(), 0, 1);
        const yearEnd = new Date(selected.getFullYear(), 11, 31);
        yearEnd.setHours(23, 59, 59, 999);
        filtered = filtered.filter(entry => {
          const entryDate = new Date(entry.fullDate);
          return entryDate >= yearStart && entryDate <= yearEnd;
        });
        break;
    }

    // Sort by date and time
    filtered.sort((a, b) => {
      const dateA = new Date(a.fullDate);
      const dateB = new Date(b.fullDate);
      if (dateA.getTime() === dateB.getTime()) {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      }
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredTimetables(filtered);
  };

  const handleCreate = () => {
    setSelectedEntry(null);
    setFormType("create");
    setShowForm(true);
  };

  const handleEdit = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setFormType("update");
    setShowForm(true);
  };

  const handleArchive = async (entry: TimetableEntry) => {
    try {
      const reason = prompt("Please enter a comment for archiving this timetable:");
      if (reason === null) return; // user cancelled
      const response = await fetch(`/api/timetables/${entry.id}/archive`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason })
      });
      if (response.ok) {
        toast.success("Timetable entry archived successfully");
        fetchTimetables();
      } else {
        toast.error("Failed to archive timetable entry");
      }
    } catch (error) {
      console.error("Failed to archive timetable entry:", error);
      toast.error("Failed to archive timetable entry");
    }
  };

  const handleRestore = async (entry: TimetableEntry) => {
    try {
      const response = await fetch(`/api/timetables/${entry.id}/restore`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        toast.success("Timetable entry restored successfully");
        fetchTimetables();
      } else {
        toast.error("Failed to restore timetable entry");
      }
    } catch (error) {
      console.error("Failed to restore timetable entry:", error);
      toast.error("Failed to restore timetable entry");
    }
  };

  const handleDelete = async (entry: TimetableEntry) => {
    const reason = prompt("Please enter a comment for deleting this timetable (required):");
    if (reason === null || reason.trim() === "") return;

    try {
      const response = await fetch(`/api/timetables/${entry.id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason })
      });
      if (response.ok) {
        toast.success("Timetable entry deleted successfully");
        fetchTimetables();
      } else {
        toast.error("Failed to delete timetable entry");
      }
    } catch (error) {
      console.error("Failed to delete timetable entry:", error);
      toast.error("Failed to delete timetable entry");
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Date", "Day", "Time", "Subject", "Class", "Teacher", "Room", "Building", "Status"],
      ...filteredTimetables.map(entry => [
        new Date(entry.fullDate).toLocaleDateString(),
        entry.day,
        `${new Date(entry.startTime).toLocaleTimeString()} - ${new Date(entry.endTime).toLocaleTimeString()}`,
        entry.subject.name,
        entry.class.name,
        `${entry.teacher.firstName} ${entry.teacher.lastName}`,
        entry.roomNumber,
        entry.buildingName || "",
        entry.status,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timetable_${viewMode}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getDaysInWeek = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        slots.push(time);
      }
    }
    return slots;
  };

  const getTimetableForTimeSlot = (date: Date, timeSlot: Date) => {
    return filteredTimetables.find(entry => {
      const entryDate = new Date(entry.fullDate);
      const entryStart = new Date(entry.startTime);
      
      return entryDate.toDateString() === date.toDateString() &&
             entryStart.getHours() === timeSlot.getHours() &&
             entryStart.getMinutes() === timeSlot.getMinutes();
    });
  };

  if (loading || !relatedData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Ensure all arrays exist with fallbacks
  const safeRelatedData = {
    branches: Array.isArray(relatedData.branches) ? relatedData.branches : [],
    classes: Array.isArray(relatedData.classes) ? relatedData.classes : [],
    academicYears: Array.isArray(relatedData.academicYears) ? relatedData.academicYears : [],
    subjects: Array.isArray(relatedData.subjects) ? relatedData.subjects : [],
    teachers: Array.isArray(relatedData.teachers) ? relatedData.teachers : []
  };

  // Dependent option lists for filters
  const filteredClassOptions = safeRelatedData.classes.filter(cls =>
    branchIdFilter ? cls.branchId === parseInt(branchIdFilter) : true
  );
  const filteredTeacherOptions = safeRelatedData.teachers.filter(t =>
    branchIdFilter ? t.branchId === parseInt(branchIdFilter) : true
  );
  const filteredSubjectOptions = safeRelatedData.subjects; // No branchId on subjects; show all

  // Additional safety check
  if (!safeRelatedData.branches || !Array.isArray(safeRelatedData.branches)) {
    console.error('safeRelatedData.branches is not an array:', safeRelatedData.branches);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-600">Error loading timetable data. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Timetable Entries</h2>
          <p className="text-sm md:text-base text-gray-600">Manage and view all timetable entries</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button 
            onClick={handleCreate} 
            className="shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Entry
          </Button>
          <Button 
            onClick={() => setShowRecurrenceForm(true)} 
            variant="outline"
            className="shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            size="sm"
          >
            <Repeat className="w-4 h-4 mr-2" />
            Create Recurring
          </Button>
          <Button 
            onClick={() => setShowBulkUpload(true)} 
            variant="outline"
            className="shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button 
            onClick={handleExport} 
            variant="outline" 
            className="shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search timetables..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-10 border-2 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Branch</label>
                <select
                  value={branchIdFilter}
                  onChange={(e) => setBranchIdFilter(e.target.value)}
                  className="w-full h-9 px-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white text-sm"
                >
                  <option value="">All branches</option>
                  {Array.isArray(safeRelatedData.branches) && safeRelatedData.branches.length > 0 ? (
                    safeRelatedData.branches.map((branch) => (
                      <option key={branch.id} value={branch.id.toString()}>
                        {branch.shortName}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No branches available</option>
                  )}
                </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-9 px-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Class</label>
                <select
                  value={classIdFilter}
                  onChange={(e) => setClassIdFilter(e.target.value)}
                  className="w-full h-9 px-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white text-sm"
                >
                  <option value="">All classes</option>
                  {Array.isArray(filteredClassOptions) && filteredClassOptions.length > 0 ? (
                    filteredClassOptions.map((cls) => (
                      <option key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No classes available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Subject</label>
                <select
                  value={subjectIdFilter}
                  onChange={(e) => setSubjectIdFilter(e.target.value)}
                  className="w-full h-9 px-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white text-sm"
                >
                  <option value="">All subjects</option>
                  {Array.isArray(filteredSubjectOptions) && filteredSubjectOptions.length > 0 ? (
                    filteredSubjectOptions.map((subj) => (
                      <option key={subj.id} value={subj.id.toString()}>
                        {subj.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No subjects available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Teacher</label>
                <select
                  value={teacherIdFilter}
                  onChange={(e) => setTeacherIdFilter(e.target.value)}
                  className="w-full h-9 px-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white text-sm"
                >
                  <option value="">All teachers</option>
                  {Array.isArray(filteredTeacherOptions) && filteredTeacherOptions.length > 0 ? (
                    filteredTeacherOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No teachers available</option>
                  )}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden min-w-max">
            <Button
              size="sm"
              variant={viewMode === "day" ? "default" : "ghost"}
              onClick={() => setViewMode("day")}
              className="rounded-none hover:bg-gray-100 transition-colors duration-200 active:scale-95"
            >
              Day
            </Button>
            <Button
              size="sm"
              variant={viewMode === "week" ? "default" : "ghost"}
              onClick={() => setViewMode("week")}
              className="rounded-none hover:bg-gray-100 transition-colors duration-200 active:scale-95"
            >
              Week
            </Button>
            <Button
              size="sm"
              variant={viewMode === "month" ? "default" : "ghost"}
              onClick={() => setViewMode("month")}
              className="rounded-none hover:bg-gray-100 transition-colors duration-200 active:scale-95"
            >
              Month
            </Button>
            <Button
              size="sm"
              variant={viewMode === "year" ? "default" : "ghost"}
              onClick={() => setViewMode("year")}
              className="rounded-none hover:bg-gray-100 transition-colors duration-200 active:scale-95"
            >
              Year
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            className="shadow-sm border-2 border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 active:scale-95"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Timetable Display */}
      {viewMode === "week" && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-8 gap-2 min-w-[800px]">
            <div className="font-medium text-sm text-gray-600 p-2">Time</div>
            {getDaysInWeek(selectedDate).map((day, index) => (
              <div key={index} className="font-medium text-sm text-center p-2 bg-gray-100 rounded-lg">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                <br />
                {day.getDate()}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {viewMode === "week" && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-8 gap-2 min-w-[800px]">
          {getTimeSlots().map((timeSlot, index) => (
            <React.Fragment key={index}>
              <div className="text-sm text-gray-600 py-2 bg-gray-50 rounded-lg text-center">
                {timeSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {getDaysInWeek(selectedDate).map((day, dayIndex) => {
                const entry = getTimetableForTimeSlot(day, timeSlot);
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div 
                    key={dayIndex} 
                    className={`min-h-[60px] border-2 rounded-xl p-2 ${
                      isToday ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200'
                    }`}
                  >
                    {entry && (
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-2 text-xs h-full">
                        <div className="font-semibold text-blue-800">{entry.subject.name}</div>
                        <div className="text-blue-700">{entry.class.name}</div>
                        <div className="text-blue-600">{entry.teacher.firstName} {entry.teacher.lastName}</div>
                        <div className="text-blue-600">{entry.roomNumber}</div>
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant={entry.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                            {entry.status}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(entry)}
                              className="h-6 w-6 p-0 hover:bg-blue-200 hover:text-blue-700 transition-all duration-200 active:scale-95"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleArchive(entry)}
                              className="h-6 w-6 p-0 hover:bg-orange-200 hover:text-orange-700 transition-all duration-200 active:scale-95"
                            >
                              <Archive className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(entry)}
                              className="h-6 w-6 p-0 hover:bg-red-200 hover:text-red-700 transition-all duration-200 active:scale-95"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
          </div>
        </div>
      )}

      {(viewMode === "day" || viewMode === "month" || viewMode === "year") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredTimetables.map((entry) => (
            <Card key={entry.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={entry.status === "ACTIVE" ? "default" : "secondary"} className="rounded-full">
                    {entry.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(entry)}
                      className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 active:scale-95"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleArchive(entry)}
                      className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600 transition-all duration-200 active:scale-95"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(entry)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 transition-all duration-200 active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">
                      {new Date(entry.startTime).toLocaleTimeString()} - {new Date(entry.endTime).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <BookOpen className="w-4 h-4 text-green-500" />
                    <span className="font-semibold">{entry.subject.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Grid3X3 className="w-4 h-4 text-indigo-500" />
                    <span>{entry.class.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-purple-500" />
                    <span>{entry.teacher.firstName} {entry.teacher.lastName}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>{entry.roomNumber} {entry.buildingName && `(${entry.buildingName})`}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{new Date(entry.fullDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredTimetables.length === 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No timetable entries found</h3>
              <p className="text-gray-600">No entries match your current filters</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modern Form Modal */}
      {showForm && (
        <ModernTimetableForm
           key={`${formType}-${selectedEntry?.id || 'new'}`}
          type={formType}
          data={selectedEntry}
          relatedData={relatedData}
          onClose={() => setShowForm(false)}
          onSave={async (data) => {
            try {
               const response = await fetch(
                 formType === "create" ? "/api/timetables" : `/api/timetables/${selectedEntry?.id}`,
                 {
                method: formType === "create" ? "POST" : "PUT",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                 body: JSON.stringify(data)
              });

              if (!response.ok) {
                throw new Error("Failed to save timetable");
              }

              // Refresh data
              fetchTimetables();
            } catch (error) {
              console.error("Error saving timetable:", error);
              throw error;
            }
           }}
         />
       )}

       {/* Recurrence Form Modal */}
       {showRecurrenceForm && (
         <TimetableRecurrenceForm
           key="recurrence-form"
           relatedData={relatedData}
           onClose={() => setShowRecurrenceForm(false)}
           onSave={(data) => {
             fetchTimetables();
             setShowRecurrenceForm(false);
           }}
         />
       )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <TimetableBulkUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            fetchTimetables();
            setShowBulkUpload(false);
          }}
        />
      )}
    </div>
  );
};

export default AdminTimetableView;
