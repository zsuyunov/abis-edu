"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimetableTemplateManager from "@/components/TimetableTemplateManager";
import TimetableBulkUploadModal from "@/components/TimetableBulkUploadModal";
import { Calendar, Repeat, Upload, List, Plus } from "lucide-react";
import Link from "next/link";

const EnhancedTimetablePage = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [relatedData, setRelatedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedData();
  }, []);

  const fetchRelatedData = async () => {
    try {
      // Fetch all related data needed for forms
      const [branchesRes, classesRes, academicYearsRes, subjectsRes, teachersRes] = await Promise.all([
        fetch("/api/branches", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        }),
        fetch("/api/classes", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        }),
        fetch("/api/academic-years", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        }),
        fetch("/api/subjects", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        }),
        fetch("/api/teachers", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        })
      ]);

      const [branches, classes, academicYears, subjects, teachers] = await Promise.all([
        branchesRes.json(),
        classesRes.json(),
        academicYearsRes.json(),
        subjectsRes.json(),
        teachersRes.json()
      ]);

      setRelatedData({
        branches,
        classes,
        academicYears,
        subjects,
        teachers
      });
    } catch (error) {
      console.error("Failed to fetch related data:", error);
    } finally {
      setLoading(false);
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
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Timetable Management</h1>
          <p className="text-gray-600">Manage recurring schedules and bulk uploads</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/list/timetables">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <List className="w-4 h-4" />
              View All Timetables
            </button>
          </Link>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            Recurring Templates
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <TimetableTemplateManager relatedData={relatedData} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View</h3>
            <p className="text-gray-600 mb-4">Visual calendar view of all timetables</p>
            <p className="text-sm text-gray-500">Coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk Upload Modal */}
      <TimetableBulkUploadModal 
        isOpen={showBulkUpload} 
        setIsOpen={setShowBulkUpload} 
      />
    </div>
  );
};

export default EnhancedTimetablePage;
