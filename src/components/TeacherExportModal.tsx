"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
import { 
  X, 
  Download, 
  FileText, 
  Calendar, 
  BarChart3,
  Clock,
  BookOpen,
  Users,
  MapPin
} from "lucide-react";
import { toast } from "sonner";

interface TimetableSlot {
  id: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName?: string;
  status: string;
  isSupervisor: boolean;
  subject: { name: string; id: number };
  class: { name: string; id: number };
  branch: { shortName: string };
  topics: TimetableSlotTopic[];
}

interface TimetableSlotTopic {
  id: number;
  topicTitle: string;
  topicDescription?: string;
  attachments: string[];
  status: string;
  progressPercentage: number;
  completedAt?: string;
  createdAt: string;
}

interface TeacherExportModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  slots: TimetableSlot[];
  teacherName: string;
}

const TeacherExportModal = ({ isOpen, setIsOpen, slots, teacherName }: TeacherExportModalProps) => {
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | "excel">("csv");
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter" | "year" | "custom">("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [includeTopics, setIncludeTopics] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(false);
  const [includeProgress, setIncludeProgress] = useState(true);
  const [loading, setLoading] = useState(false);

  const getFilteredSlots = () => {
    let filtered = [...slots];
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (dateRange) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          return filtered;
        }
        break;
      default:
        return filtered;
    }

    return filtered.filter(slot => {
      const slotDate = new Date(slot.slotDate);
      return slotDate >= startDate && slotDate <= endDate;
    });
  };

  const generateCSV = () => {
    const filteredSlots = getFilteredSlots();
    const headers = [
      "Date",
      "Start Time",
      "End Time",
      "Subject",
      "Class",
      "Room",
      "Building",
      "Status",
    ];

    if (includeTopics) {
      headers.push("Topics", "Topic Status", "Progress %");
    }

    const rows = filteredSlots.map(slot => {
      const baseRow = [
        new Date(slot.slotDate).toLocaleDateString(),
        new Date(slot.startTime).toLocaleTimeString(),
        new Date(slot.endTime).toLocaleTimeString(),
        slot.subject.name,
        slot.class.name,
        slot.roomNumber,
        slot.buildingName || "",
        slot.status,
      ];

      if (includeTopics) {
        const topics = slot.topics.map(topic => topic.topicTitle).join("; ");
        const topicStatuses = slot.topics.map(topic => topic.status).join("; ");
        const progressValues = slot.topics.map(topic => topic.progressPercentage).join("; ");
        
        baseRow.push(topics, topicStatuses, progressValues);
      }

      return baseRow;
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    return csvContent;
  };

  const generateExcel = () => {
    // For Excel generation, we would use a library like xlsx
    // This is a simplified version that generates CSV format
    return generateCSV();
  };

  const generatePDF = () => {
    // For PDF generation, we would use a library like jsPDF or Puppeteer
    // This is a placeholder for the PDF content structure
    const filteredSlots = getFilteredSlots();
    
    return {
      title: `${teacherName}'s Timetable Report`,
      dateRange: dateRange,
      totalSlots: filteredSlots.length,
      slots: filteredSlots.map(slot => ({
        date: new Date(slot.slotDate).toLocaleDateString(),
        time: `${new Date(slot.startTime).toLocaleTimeString()} - ${new Date(slot.endTime).toLocaleTimeString()}`,
        subject: slot.subject.name,
        class: slot.class.name,
        room: slot.roomNumber,
        building: slot.buildingName || "",
        status: slot.status,
        topics: includeTopics ? slot.topics.map(topic => ({
          title: topic.topicTitle,
          status: topic.status,
          progress: topic.progressPercentage
        })) : []
      }))
    };
  };

  const handleExport = async () => {
    setLoading(true);
    
    try {
      const filteredSlots = getFilteredSlots();
      
      if (filteredSlots.length === 0) {
        toast.error("No data to export for the selected date range");
        return;
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case "csv":
          content = generateCSV();
          filename = `teacher_timetable_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = "text/csv";
          break;
        case "excel":
          content = generateExcel();
          filename = `teacher_timetable_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = "text/csv";
          break;
        case "pdf":
          // For PDF, we would generate the actual PDF content
          const pdfData = generatePDF();
          content = JSON.stringify(pdfData, null, 2); // Placeholder
          filename = `teacher_timetable_${dateRange}_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = "application/json";
          break;
        default:
          throw new Error("Unsupported export format");
      }

      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Export completed successfully");
      setIsOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Timetable
              </CardTitle>
              <CardDescription>
                Export your timetable data in various formats
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value as "csv" | "pdf" | "excel")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="csv">CSV (Comma Separated Values)</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="pdf">PDF Document</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value as "week" | "month" | "quarter" | "year" | "custom")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-4">
            <Label>Export Options</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeTopics"
                  checked={includeTopics}
                  onChange={(e) => setIncludeTopics(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="includeTopics" className="text-sm">
                  Include classwork topics and descriptions
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeProgress"
                  checked={includeProgress}
                  onChange={(e) => setIncludeProgress(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="includeProgress" className="text-sm">
                  Include progress percentages
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeAnalytics"
                  checked={includeAnalytics}
                  onChange={(e) => setIncludeAnalytics(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="includeAnalytics" className="text-sm">
                  Include analytics summary
                </Label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <p><strong>Format:</strong> {exportFormat.toUpperCase()}</p>
                <p><strong>Date Range:</strong> {dateRange}</p>
                <p><strong>Records:</strong> {getFilteredSlots().length} timetable slots</p>
                <p><strong>Teacher:</strong> {teacherName}</p>
                <p><strong>Options:</strong> 
                  {includeTopics && " Topics"}
                  {includeProgress && " Progress"}
                  {includeAnalytics && " Analytics"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              {loading ? "Exporting..." : "Export"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherExportModal;
