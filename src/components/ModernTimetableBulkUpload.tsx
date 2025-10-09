"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { csrfFetch } from '@/hooks/useCsrfToken';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Separator } from "@/components/ui/separator"; // Commented out as it doesn't exist
import { 
  Upload,
  Download,
  FileText,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Zap,
  Target,
  Users,
  Clock,
  MapPin,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";

interface ModernTimetableBulkUploadProps {
  isOpen: boolean;
  onClose: () => void;
  relatedData?: any;
}

interface UploadProgress {
  stage: "idle" | "validating" | "processing" | "completed" | "error";
  progress: number;
  processedRows: number;
  totalRows: number;
  successRows: number;
  errorRows: number;
  errors: Array<{
    row: number;
    column: string;
    message: string;
  }>;
}

const ModernTimetableBulkUpload: React.FC<ModernTimetableBulkUploadProps> = ({
  isOpen,
  onClose,
  relatedData
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    stage: "idle",
    progress: 0,
    processedRows: 0,
    totalRows: 0,
    successRows: 0,
    errorRows: 0,
    errors: []
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample data for template generation
  const generateTemplate = () => {
    const csvContent = [
      ["Branch", "Class", "Academic Year", "Subject", "Teacher ID", "Day", "Start Time", "End Time", "Room Number", "Building Name"],
      ["Science", "Grade 10A", "2024-25", "Physics", "T001", "MONDAY", "09:00", "10:00", "204", "Main Building"],
      ["Science", "Grade 10A", "2024-25", "Chemistry", "T002", "TUESDAY", "10:00", "11:00", "205", "Main Building"],
      ["Science", "Grade 10B", "2024-25", "Mathematics", "T003", "WEDNESDAY", "11:00", "12:00", "206", "Main Building"],
    ];

    const csvString = csvContent.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timetable_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success("Template downloaded successfully!");
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error("Please select a valid CSV or Excel file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setUploadProgress({
      stage: "idle",
      progress: 0,
      processedRows: 0,
      totalRows: 0,
      successRows: 0,
      errorRows: 0,
      errors: []
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const processUpload = async () => {
    if (!selectedFile) return;

    setUploadProgress(prev => ({ ...prev, stage: "validating", progress: 10 }));

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Add related data for validation
      if (relatedData) {
        formData.append("relatedData", JSON.stringify(relatedData));
      }

      const response = await csrfFetch("/api/timetables/bulk-upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev.progress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, progress: prev.progress + 10 };
        });
      }, 200);

      const result = await response.json();

      clearInterval(progressInterval);

      setUploadProgress({
        stage: "completed",
        progress: 100,
        processedRows: result.totalRows || 0,
        totalRows: result.totalRows || 0,
        successRows: result.successRows || 0,
        errorRows: result.errorRows || 0,
        errors: result.errors || []
      });

      if (result.errorRows === 0) {
        toast.success(`Successfully uploaded ${result.successRows} timetable entries!`);
      } else {
        toast.warning(`Upload completed with ${result.errorRows} errors out of ${result.totalRows} rows`);
      }

    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress(prev => ({
        ...prev,
        stage: "error",
        progress: 0
      }));
      toast.error("Upload failed. Please check your file and try again.");
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadProgress({
      stage: "idle",
      progress: 0,
      processedRows: 0,
      totalRows: 0,
      successRows: 0,
      errorRows: 0,
      errors: []
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-0 shadow-2xl">
        <CardHeader className="relative pb-4">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-red-100">
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Bulk Timetable Upload
              </CardTitle>
              <CardDescription className="text-gray-600">
                Upload multiple timetable entries at once using Excel or CSV files
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Template Download Section */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Download Template</h3>
                    <p className="text-sm text-blue-700">Get the Excel/CSV template with proper format and sample data</p>
                  </div>
                </div>
                <Button
                  onClick={generateTemplate}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Your File
            </h3>

            <div
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                ${dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : uploadProgress.stage === "error" 
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-gray-500" />
                </div>
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      File Ready
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports CSV, XLSX, XLS files up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedFile && uploadProgress.stage === "idle" && (
              <div className="flex gap-3">
                <Button
                  onClick={processUpload}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Process Upload
                </Button>
                <Button
                  onClick={resetUpload}
                  variant="outline"
                  className="border-2 hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress.stage !== "idle" && (
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                      {uploadProgress.stage === "validating" && <Loader2 className="w-4 h-4 animate-spin" />}
                      {uploadProgress.stage === "processing" && <Loader2 className="w-4 h-4 animate-spin" />}
                      {uploadProgress.stage === "completed" && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {uploadProgress.stage === "error" && <XCircle className="w-4 h-4 text-red-600" />}
                      
                      {uploadProgress.stage === "validating" && "Validating File..."}
                      {uploadProgress.stage === "processing" && "Processing Entries..."}
                      {uploadProgress.stage === "completed" && "Upload Completed"}
                      {uploadProgress.stage === "error" && "Upload Failed"}
                    </h3>
                    
                    <span className="text-sm font-medium text-orange-800">
                      {uploadProgress.progress}%
                    </span>
                  </div>

                  <Progress value={uploadProgress.progress} className="h-3" />

                  {uploadProgress.stage === "completed" && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{uploadProgress.totalRows}</div>
                        <div className="text-gray-600">Total Rows</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{uploadProgress.successRows}</div>
                        <div className="text-gray-600">Successful</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{uploadProgress.errorRows}</div>
                        <div className="text-gray-600">Errors</div>
                      </div>
                    </div>
                  )}

                  {uploadProgress.errors.length > 0 && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-800">Validation Errors</AlertTitle>
                      <AlertDescription className="text-red-700">
                        <div className="max-h-32 overflow-y-auto mt-2 space-y-1">
                          {uploadProgress.errors.slice(0, 5).map((error, index) => (
                            <div key={index} className="text-xs">
                              Row {error.row}, Column "{error.column}": {error.message}
                            </div>
                          ))}
                          {uploadProgress.errors.length > 5 && (
                            <div className="text-xs font-medium">
                              ... and {uploadProgress.errors.length - 5} more errors
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {uploadProgress.stage === "completed" && uploadProgress.errorRows === 0 && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Upload Successful!</AlertTitle>
                      <AlertDescription className="text-green-700">
                        All {uploadProgress.successRows} timetable entries have been successfully created.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Format Guide */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                File Format Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Required Columns
                  </h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Branch (exact name match)</li>
                    <li>• Class (exact name match)</li>
                    <li>• Academic Year (exact name match)</li>
                    <li>• Subject (exact name match)</li>
                    <li>• Teacher ID (exact match)</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    Schedule Format
                  </h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Day: MONDAY, TUESDAY, etc.</li>
                    <li>• Time: HH:MM format (24-hour)</li>
                    <li>• Room Number: Any text</li>
                    <li>• Building Name: Optional</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-200 my-4" />

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  Important Notes
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• All data must match exactly with existing records in the system</li>
                  <li>• The system will validate for scheduling conflicts</li>
                  <li>• Teachers must be assigned to the specified branch</li>
                  <li>• Classes must belong to the specified branch and academic year</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {uploadProgress.stage === "completed" && (
              <Button
                onClick={resetUpload}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Upload Another File
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernTimetableBulkUpload;
