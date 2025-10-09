"use client";

import { useState } from "react";
import { csrfFetch } from '@/hooks/useCsrfToken';
import { Download, FileText, Calendar, BarChart3, X } from "lucide-react";
import { toast } from "react-toastify";

interface TimetableExportModalProps {
  teacherId: string;
  filters: any;
  onClose: () => void;
}

const TimetableExportModal = ({ teacherId, filters, onClose }: TimetableExportModalProps) => {
  const [exportType, setExportType] = useState<"timetable" | "topics" | "analytics">("timetable");
  const [format, setFormat] = useState<"pdf" | "excel">("pdf");
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [includeOptions, setIncludeOptions] = useState({
    topics: true,
    attachments: false,
    progress: true,
    analytics: false
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const exportData = {
        teacherId,
        exportType,
        format,
        dateRange,
        includeOptions,
        filters
      };

      const response = await csrfFetch('/api/teacher-timetables/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const filename = `timetable_${exportType}_${new Date().toISOString().split('T')[0]}.${format}`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Export completed successfully!');
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Export Timetable Data</h2>
              <p className="text-sm text-gray-600">Choose what to export and in which format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* EXPORT TYPE */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Export Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setExportType("timetable")}
              className={`p-4 rounded-lg border-2 transition-all ${
                exportType === "timetable"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-sm font-medium">Timetable</div>
              <div className="text-xs text-gray-500">Schedule & lessons</div>
            </button>
            
            <button
              onClick={() => setExportType("topics")}
              className={`p-4 rounded-lg border-2 transition-all ${
                exportType === "topics"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <FileText className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-sm font-medium">Topics Report</div>
              <div className="text-xs text-gray-500">Lesson topics & progress</div>
            </button>
            
            <button
              onClick={() => setExportType("analytics")}
              className={`p-4 rounded-lg border-2 transition-all ${
                exportType === "analytics"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-medium">Analytics</div>
              <div className="text-xs text-gray-500">Progress & statistics</div>
            </button>
          </div>
        </div>

        {/* FORMAT */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormat("pdf")}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                format === "pdf"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-sm font-medium">PDF</div>
              <div className="text-xs text-gray-500">Formatted document</div>
            </button>
            
            <button
              onClick={() => setFormat("excel")}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                format === "excel"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-sm font-medium">Excel</div>
              <div className="text-xs text-gray-500">Spreadsheet data</div>
            </button>
          </div>
        </div>

        {/* DATE RANGE */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* INCLUDE OPTIONS */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Include Options</label>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeOptions.topics}
                onChange={(e) => setIncludeOptions(prev => ({ ...prev, topics: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium">Lesson Topics</div>
                <div className="text-xs text-gray-500">Include topic titles and descriptions</div>
              </div>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeOptions.attachments}
                onChange={(e) => setIncludeOptions(prev => ({ ...prev, attachments: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium">Attachments</div>
                <div className="text-xs text-gray-500">Include links to topic attachments</div>
              </div>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeOptions.progress}
                onChange={(e) => setIncludeOptions(prev => ({ ...prev, progress: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium">Progress Information</div>
                <div className="text-xs text-gray-500">Include completion percentages and status</div>
              </div>
            </label>
            
            {exportType === "analytics" && (
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={includeOptions.analytics}
                  onChange={(e) => setIncludeOptions(prev => ({ ...prev, analytics: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium">Detailed Analytics</div>
                  <div className="text-xs text-gray-500">Include charts and statistical analysis</div>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimetableExportModal;
