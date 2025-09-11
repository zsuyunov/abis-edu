/*
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  X, 
  Download, 
  FileText, 
  Calendar, 
  BarChart3,
  Clock,
  BookOpen,
  User,
  MapPin,
  Users
} from "lucide-react";
import { toast } from "sonner";

interface ParentExportModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  childId: string;
  academicYearId: number;
  childName: string;
  isCurrent: boolean;
}

const ParentExportModal = ({ 
  isOpen, 
  setIsOpen, 
  childId, 
  academicYearId, 
  childName, 
  isCurrent 
}: ParentExportModalProps) => {
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | "excel">("csv");
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter" | "year" | "custom">("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [includeTopics, setIncludeTopics] = useState(true);
  const [includeProgress, setIncludeProgress] = useState(true);
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [includeTeacherInfo, setIncludeTeacherInfo] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      // Fetch timetable data
      const response = await fetch(`/api/parent/timetable-slots?childId=${childId}&academicYearId=${academicYearId}`, {
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
          filename = `${childName.replace(/\s+/g, '_')}_timetable_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = "text/csv";
          break;
        case "excel":
          content = generateCSV(slots); // Simplified - would use xlsx library in real implementation
          filename = `${childName.replace(/\s+/g, '_')}_timetable_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = "text/csv";
          break;
        case "pdf":
          content = generatePDFContent(slots);
          filename = `${childName.replace(/\s+/g, '_')}_timetable_${dateRange}_${new Date().toISOString().split('T')[0]}.txt`;
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

    if (includeTeacherInfo) {
      headers.push("Teacher Email", "Teacher Phone");
    }

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

      if (includeTeacherInfo) {
        baseRow.push(
          slot.teacher.email || "",
          slot.teacher.phone || ""
        );
      }

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
      `Parent Timetable Report`,
      `Child: ${childName}`,
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
      
      if (includeTeacherInfo) {
        content.push(`   Teacher Email: ${slot.teacher.email || 'N/A'}`);
        content.push(`   Teacher Phone: ${slot.teacher.phone || 'N/A'}`);
      }
      
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Download className="w-6 h-6" />
                Export Timetable
              </CardTitle>
              <CardDescription className="text-blue-100">
                Export {childName}'s timetable data for home study planning
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          {/* Export Format }
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <SelectTrigger className="border-2 border-gray-200 rounded-xl focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CSV (Comma Separated Values)
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Excel Spreadsheet
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF Document
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range }
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Date Range</Label>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger className="border-2 border-gray-200 rounded-xl focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range }
          {dateRange === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Start Date</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border-2 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">End Date</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border-2 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Export Options }
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Export Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeTopics"
                    checked={includeTopics}
                    onCheckedChange={(checked) => setIncludeTopics(checked as boolean)}
                  />
                  <Label htmlFor="includeTopics" className="text-sm">
                    Include lesson topics and descriptions
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeProgress"
                    checked={includeProgress}
                    onCheckedChange={(checked) => setIncludeProgress(checked as boolean)}
                  />
                  <Label htmlFor="includeProgress" className="text-sm">
                    Include progress percentages
                  </Label>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeAttachments"
                    checked={includeAttachments}
                    onCheckedChange={(checked) => setIncludeAttachments(checked as boolean)}
                  />
                  <Label htmlFor="includeAttachments" className="text-sm">
                    Include attachment information
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeTeacherInfo"
                    checked={includeTeacherInfo}
                    onCheckedChange={(checked) => setIncludeTeacherInfo(checked as boolean)}
                  />
                  <Label htmlFor="includeTeacherInfo" className="text-sm">
                    Include teacher contact information
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Preview }
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Preview</Label>
            <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Format:</strong> {exportFormat.toUpperCase()}</p>
                <p><strong>Date Range:</strong> {dateRange}</p>
                <p><strong>Child:</strong> {childName}</p>
                <p><strong>Academic Year:</strong> {academicYearId}</p>
                <p><strong>Options:</strong> 
                  {includeTopics && " Topics"}
                  {includeProgress && " Progress"}
                  {includeAttachments && " Attachments"}
                  {includeTeacherInfo && " Teacher Info"}
                </p>
              </div>
            </div>
          </div>

          {/* Parent Tips }
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Parent Tips
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use this data to plan study sessions at home</li>
              <li>• Track your child's progress and identify areas for improvement</li>
              <li>• Keep teacher contact information handy for communication</li>
              <li>• Review lesson topics to support your child's learning</li>
            </ul>
          </div>

          {/* Actions }
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="border-2 border-gray-200 rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loading} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              {loading ? "Exporting..." : "Export"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentExportModal;

*/