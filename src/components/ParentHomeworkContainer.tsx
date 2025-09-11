/*
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/jwt-auth';
import { AcademicYear, Homework, Subject, HomeworkSubmission, HomeworkAttachment, SubmissionAttachment } from '@prisma/client';
import ParentChildHomeworkSelector from './ParentChildHomeworkSelector';
import ParentHomeworkFilters from './ParentHomeworkFilters';
import ParentHomeworkOverview from './ParentHomeworkOverview';
import ParentHomeworkList from './ParentHomeworkList';
import ParentHomeworkAnalytics from './ParentHomeworkAnalytics';
import ParentHomeworkAlerts from './ParentHomeworkAlerts';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Extend types to include relations
interface ChildInfo {
  id: string;
  firstName: string;
  lastName: string;
  branchId: number;
  classId: number;
  academicYearId: number;
  branch: { name: string };
  class: { name: string };
}

interface HomeworkWithDetails extends Homework {
  subject: { name: string };
  teacher: { firstName: string; lastName: string };
  attachments: HomeworkAttachment[];
  submissions: (HomeworkSubmission & { attachments: SubmissionAttachment[] })[];
}

interface ClassStats {
  totalHomeworks: number;
  totalStudents: number;
  classAverageCompletionRate: number;
  childCompletionRate: number;
  childSubmittedCount: number;
}

const ParentHomeworkContainer = () => {
  const { userId } = useAuth();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [homeworks, setHomeworks] = useState<HomeworkWithDetails[]>([]);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showPastAcademicYears, setShowPastAcademicYears] = useState(false);

  // Fetch children and initial data
  const fetchChildren = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/parent-homework');
      if (!res.ok) throw new Error('Failed to fetch children');
      const data = await res.json();
      setChildren(data.children);
      setSelectedChild(data.selectedChild);
      setHomeworks(data.homeworks);
      setClassStats(data.classStats);
      
      // Auto-select first child if available
      if (data.children.length > 0 && !selectedChildId) {
        setSelectedChildId(data.children[0].id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      toast.error('Failed to load children data.');
    }
  }, [userId, selectedChildId]);

  // Fetch academic years for selected child
  const fetchAcademicYears = useCallback(async () => {
    if (!selectedChildId) return;
    try {
      const res = await fetch(`/api/academic-years?studentId=${selectedChildId}`);
      if (!res.ok) throw new Error('Failed to fetch academic years');
      const data = await res.json();
      setAcademicYears(data);
      const currentYear = data.find((year: AcademicYear) => year.isCurrent);
      setSelectedAcademicYearId(currentYear ? currentYear.id : (data.length > 0 ? data[0].id : null));
    } catch (error) {
      console.error('Error fetching academic years:', error);
      toast.error('Failed to load academic years.');
    }
  }, [selectedChildId]);

  // Fetch subjects for selected child
  const fetchSubjects = useCallback(async () => {
    if (!selectedChildId) return;
    try {
      const res = await fetch(`/api/subjects?studentId=${selectedChildId}`);
      if (!res.ok) throw new Error('Failed to fetch subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects.');
    }
  }, [selectedChildId]);

  // Fetch homework data
  const fetchHomeworks = useCallback(async () => {
    if (!userId || !selectedChildId || !selectedAcademicYearId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        childId: selectedChildId,
        academicYearId: selectedAcademicYearId.toString(),
      });
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId.toString());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const res = await fetch(`/api/parent-homework?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch homework data');
      const data = await res.json();
      setHomeworks(data.homeworks);
      setClassStats(data.classStats);
      setSelectedChild(data.selectedChild);
    } catch (error) {
      console.error('Error fetching homework data:', error);
      toast.error('Failed to load homework data.');
      setHomeworks([]);
      setClassStats(null);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedChildId, selectedAcademicYearId, selectedSubjectId, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (selectedChildId) {
      fetchAcademicYears();
      fetchSubjects();
    }
  }, [selectedChildId, fetchAcademicYears, fetchSubjects]);

  useEffect(() => {
    fetchHomeworks();
  }, [fetchHomeworks]);

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    setSelectedSubjectId(null); // Reset subject filter when changing child
    setStartDate(null);
    setEndDate(null);
    setStatusFilter('ALL');
  };

  const handleAcademicYearToggle = (showPast: boolean) => {
    setShowPastAcademicYears(showPast);
    if (!showPast) {
      const currentYear = academicYears.find(year => year.isCurrent);
      setSelectedAcademicYearId(currentYear ? currentYear.id : null);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!userId || !selectedChildId || !selectedAcademicYearId) {
      toast.error('Please select a child and academic year first.');
      return;
    }

    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        childId: selectedChildId,
        academicYearId: selectedAcademicYearId.toString(),
        format,
      });
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId.toString());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const res = await fetch(`/api/parent-homework/export?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to export homework report');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `homework_report_${selectedChild?.firstName}_${selectedChild?.lastName}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Homework report exported successfully!');
    } catch (error) {
      console.error('Error exporting homework report:', error);
      toast.error('Failed to export homework report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ParentChildHomeworkSelector
        children={children}
        selectedChildId={selectedChildId}
        onChildChange={handleChildChange}
      />

      {selectedChildId && (
        <>
          <ParentHomeworkFilters
            academicYears={academicYears}
            subjects={subjects}
            selectedAcademicYearId={selectedAcademicYearId}
            setSelectedAcademicYearId={setSelectedAcademicYearId}
            selectedSubjectId={selectedSubjectId}
            setSelectedSubjectId={setSelectedSubjectId}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            showPastAcademicYears={showPastAcademicYears}
            onAcademicYearToggle={handleAcademicYearToggle}
            onApplyFilters={fetchHomeworks}
          />

          <div className="flex justify-end gap-2">
            <Button onClick={() => handleExport('pdf')} disabled={loading || isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Export PDF
            </Button>
            <Button onClick={() => handleExport('excel')} disabled={loading || isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Export Excel
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="ml-2 text-gray-600">Loading homework data...</p>
            </div>
          ) : homeworks.length > 0 ? (
            <div className="space-y-6">
              <ParentHomeworkAlerts homeworks={homeworks} childName={selectedChild?.firstName || ''} />
              <ParentHomeworkOverview homeworks={homeworks} classStats={classStats} />
              <ParentHomeworkAnalytics homeworks={homeworks} classStats={classStats} />
              <ParentHomeworkList homeworks={homeworks} childName={selectedChild?.firstName || ''} />
            </div>
          ) : (
            <p className="text-center text-gray-500">No homework assignments found for the selected criteria.</p>
          )}
        </>
      )}
    </div>
  );
};

export default ParentHomeworkContainer;

*/