"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  X,
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface TimetableBulkUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

const TimetableBulkUpload: React.FC<TimetableBulkUploadProps> = ({
  onClose,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = async () => {
    try {
      const response = await fetch("/api/timetable-bulk-upload/template", {
        method: "GET",
        headers: {
          "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "timetable_template.xlsx";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Template downloaded successfully");
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to download template: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error(`Failed to download template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          selectedFile.type === "application/vnd.ms-excel" ||
          selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setUploadResult(null);
      } else {
        toast.error("Please select a valid Excel (.xlsx, .xls) or CSV file");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/timetable-bulk-upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const result: UploadResult = await response.json();
        setUploadResult(result);
        
        if (result.success) {
          toast.success(`Successfully uploaded ${result.successfulRows} timetable entries`);
          if (result.failedRows === 0) {
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 2000);
          }
        } else {
          toast.error("Upload completed with errors");
        }
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Bulk Upload Timetables</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!uploadResult && (
            <>
              {/* Instructions */}
              <div className="text-sm text-gray-600 space-y-2">
                <p>Upload multiple timetable entries using an Excel or CSV file.</p>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-blue-800 font-medium">Instructions:</p>
                  <ul className="text-blue-700 text-xs mt-1 space-y-1">
                    <li>1. Download the template file</li>
                    <li>2. Fill in your timetable data</li>
                    <li>3. Upload the completed file</li>
                  </ul>
                </div>
              </div>

              {/* Download Template */}
              <Button
                type="button"
                variant="outline"
                onClick={downloadTemplate}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">{file.name}</span>
                </div>
              )}

              {/* Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Uploading... {progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!file || uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <div className="space-y-4">
              <div className="text-center">
                {uploadResult.success ? (
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                )}
                <h3 className="text-lg font-medium">
                  {uploadResult.success ? "Upload Successful!" : "Upload Completed with Issues"}
                </h3>
              </div>

              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Rows:</span>
                  <span className="font-medium">{uploadResult.totalRows}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Successful:</span>
                  <span className="font-medium text-green-600">{uploadResult.successfulRows}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Failed:</span>
                  <span className="font-medium text-red-600">{uploadResult.failedRows}</span>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800">Errors:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive" className="py-2">
                        <AlertDescription className="text-xs">
                          Row {error.row}: {error.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetUpload}>
                  Upload Another File
                </Button>
                <Button onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableBulkUpload;
