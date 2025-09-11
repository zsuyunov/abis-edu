"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox"; // Commented out as it doesn't exist
import { 
  X, 
  Download, 
  FileText, 
  Calendar, 
  BarChart3,
  Clock,
  BookOpen,
  User,
  MapPin
} from "lucide-react";
import { toast } from "sonner";

interface StudentExportModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  academicYearId: number;
  studentId: string;
  studentName: string;
  isCurrent: boolean;
}

const StudentExportModal = ({ 
  isOpen, 
  setIsOpen, 
  academicYearId, 
  studentId, 
  studentName, 
  isCurrent 
}: StudentExportModalProps) => {
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | "excel">("csv");
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter" | "year" | "custom">("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [includeTopics, setIncludeTopics] = useState(true);
  const [includeProgress, setIncludeProgress] = useState(true);
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      // Fetch timetable data
      const response = await fetch(`/api/student/timetable-slots?academicYearId=${academicYearId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const slots = await response.json();

      if (slots.length === 0) {
        toast.error("No data to export for the selected period");
        return;
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case "csv":
          content = generateCSV(slots);
          filename = `student_timetable_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = "text/csv";
          break;
        case "excel":
          content = generateCSV(slots); // Simplified - would use xlsx library in real implementation
          filename = `student_timetable_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = "text/csv";
          break;
        case "pdf":
          content = generatePDFContent(slots);
          filename = `student_timetable_${dateRange}_${new Date().toISOString().split('T')[0]}.txt`;
          mimeType = "text/plain";
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

  const generateCSV = (slots: any[]) => {
    const headers = [
      "Date",
      "Start Time",
      "End Time",
      "Subject",
      "Teacher",
      "Room",
      "Building",
      "Status",
    ];

    if (includeTopics) {
      headers.push("Topics", "Topic Status", "Progress %");
    }

    if (includeAttachments) {
      headers.push("Attachments");
    }

    const rows = slots.map(slot => {
      const baseRow = [
        new Date(slot.slotDate).toLocaleDateString(),
        new Date(slot.startTime).toLocaleTimeString(),
        new Date(slot.endTime).toLocaleTimeString(),
        slot.subject.name,
        `${slot.teacher.firstName} ${slot.teacher.lastName}`,
        slot.roomNumber,
        slot.buildingName || "",
        slot.status,
      ];

      if (includeTopics) {
        const topics = slot.topics.map((topic: any) => topic.topicTitle).join("; ");
        const topicStatuses = slot.topics.map((topic: any) => topic.status).join("; ");
        const progressValues = slot.topics.map((topic: any) => topic.progressPercentage).join("; ");
        
        baseRow.push(topics, topicStatuses, progressValues);
      }

      if (includeAttachments) {
        const attachments = slot.topics.flatMap((topic: any) => topic.attachments).join("; ");
        baseRow.push(attachments);
      }

      return baseRow;
    });

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
  };

  const generatePDFContent = (slots: any[]) => {
    const content = [
      `Student Timetable Report`,
      `Student: ${studentName}`,
      `Academic Year: ${academicYearId}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      ``,
      `Timetable Details:`,
      `================`,
      ``,
    ];

    slots.forEach((slot, index) => {
      content.push(`${index + 1}. ${slot.subject.name}`);
      content.push(`   Date: ${new Date(slot.slotDate).toLocaleDateString()}`);
      content.push(`   Time: ${new Date(slot.startTime).toLocaleTimeString()} - ${new Date(slot.endTime).toLocaleTimeString()}`);
      content.push(`   Teacher: ${slot.teacher.firstName} ${slot.teacher.lastName}`);
      content.push(`   Room: ${slot.roomNumber} ${slot.buildingName ? `(${slot.buildingName})` : ''}`);
      content.push(`   Status: ${slot.status}`);
      
      if (includeTopics && slot.topics.length > 0) {
        content.push(`   Topics:`);
        slot.topics.forEach((topic: any) => {
          content.push(`     - ${topic.topicTitle} (${topic.status}, ${topic.progressPercentage}%)`);
          if (topic.topicDescription) {
            content.push(`       ${topic.topicDescription}`);
          }
        });
      }
      
      content.push(``);
    });

    return content.join('\n');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-lg max-h-[95vh] overflow-y-auto">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Download className="w-4 h-4" />
                Export Timetable
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Export your timetable data in various formats
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="p-1">
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Export Format</Label>
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value as "csv" | "pdf" | "excel")}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="csv">CSV (Comma Separated Values)</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="pdf">PDF Document</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Date Range</Label>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value as "week" | "month" | "quarter" | "year" | "custom")}
              className="w-full p-2 border border-gray-300 rounded-md"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Start Date</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">End Date</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm">Export Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeTopics"
                  checked={includeTopics}
                  onChange={(e) => setIncludeTopics(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="includeTopics" className="text-sm">
                  Include lesson topics and descriptions
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeProgress"
                  checked={includeProgress}
                  onChange={(e) => setIncludeProgress(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="includeProgress" className="text-sm">
                  Include progress percentages
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeAttachments"
                  checked={includeAttachments}
                  onChange={(e) => setIncludeAttachments(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="includeAttachments" className="text-sm">
                  Include attachment information
                </Label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Preview</Label>
            <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600">
                <p><strong>Format:</strong> {exportFormat.toUpperCase()}</p>
                <p><strong>Date Range:</strong> {dateRange}</p>
                <p><strong>Student:</strong> {studentName}</p>
                <p><strong>Academic Year:</strong> {academicYearId}</p>
                <p><strong>Options:</strong> 
                  {includeTopics && " Topics"}
                  {includeProgress && " Progress"}
                  {includeAttachments && " Attachments"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="text-xs sm:text-sm">
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loading} className="text-xs sm:text-sm">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {loading ? "Exporting..." : "Export"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentExportModal;
