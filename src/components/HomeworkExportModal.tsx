"use client";

import React, { useState } from "react";
import { 
  X, 
  Download, 
  FileText, 
  Table, 
  Filter, 
  Calendar,
  Users,
  BookOpen,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

interface ExportFilters {
  dateRange: 'all' | 'last_week' | 'last_month' | 'custom';
  status: 'all' | 'pending' | 'submitted' | 'graded';
  branch: string;
  class: string;
  subject: string;
  customStartDate: string;
  customEndDate: string;
}

interface HomeworkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Array<{ id: number; shortName: string }>;
  classes: Array<{ id: number; name: string }>;
  subjects: Array<{ id: number; name: string }>;
}

const HomeworkExportModal = ({ isOpen, onClose, branches, classes, subjects }: HomeworkExportModalProps) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [exportType, setExportType] = useState<'summary' | 'detailed'>('summary');
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>({
    dateRange: 'all',
    status: 'all',
    branch: 'all',
    class: 'all',
    subject: 'all',
    customStartDate: '',
    customEndDate: ''
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams({
        format: exportFormat,
        type: exportType,
        ...filters,
      });

      const response = await fetch(`/api/homework/export?${queryParams}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `homework-report-${Date.now()}.${exportFormat === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        onClose();
      }
    } catch (error) {
      console.error("Error exporting homework:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Download className="w-6 h-6 text-blue-600" />
              Export Homework Reports
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Generate comprehensive homework reports in PDF or Excel format
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Format Selection */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Export Format
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('pdf')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  exportFormat === 'pdf'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">PDF Report</div>
                <div className="text-xs text-gray-600">Formatted document</div>
              </button>
              <button
                onClick={() => setExportFormat('excel')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  exportFormat === 'excel'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <Table className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">Excel Sheet</div>
                <div className="text-xs text-gray-600">Spreadsheet data</div>
              </button>
            </div>
          </div>

          {/* Report Type Selection */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Type</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportType('summary')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  exportType === 'summary'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Summary Report</div>
                <div className="text-xs text-gray-600 mt-1">
                  Overview with statistics and completion rates
                </div>
              </button>
              <button
                onClick={() => setExportType('detailed')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  exportType === 'detailed'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Detailed Report</div>
                <div className="text-xs text-gray-600 mt-1">
                  Individual student responses and grades
                </div>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-green-600" />
              Filters
            </h3>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="all">All Time</option>
                <option value="last_week">Last Week</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.customStartDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.customEndDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
              </select>
            </div>

            {/* Branch, Class, Subject Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  Branch
                </label>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="all">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id.toString()}>
                      {branch.shortName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Class
                </label>
                <select
                  value={filters.class}
                  onChange={(e) => setFilters(prev => ({ ...prev, class: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="all">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  Subject
                </label>
                <select
                  value={filters.subject}
                  onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Export Preview */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Export Preview</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Format: {exportFormat.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Type: {exportType === 'summary' ? 'Summary Report' : 'Detailed Report'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Date Range: {
                  filters.dateRange === 'all' ? 'All Time' :
                  filters.dateRange === 'last_week' ? 'Last Week' :
                  filters.dateRange === 'last_month' ? 'Last Month' :
                  'Custom Range'
                }</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span>Status Filter: {filters.status === 'all' ? 'All Statuses' : filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeworkExportModal;
