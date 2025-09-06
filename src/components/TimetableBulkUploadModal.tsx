"use client";

import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { Upload, Download, FileText, AlertCircle, CheckCircle, X, Eye, RefreshCw } from "lucide-react";

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

interface UploadResult {
  uploadId: number;
  validation?: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    errors: ValidationError[];
    canProceed: boolean;
  };
  results?: {
    totalRows: number;
    successRows: number;
    errorRows: number;
    errors: ValidationError[];
  };
}

const TimetableBulkUploadModal = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const [step, setStep] = useState<"upload" | "validate" | "results">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Please upload Excel (.xlsx, .xls) or CSV file");
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("File size must be less than 10MB");
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch("/api/timetable-bulk-upload/template", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timetable-bulk-upload-template-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Template downloaded successfully!");
      } else {
        toast.error("Failed to download template");
      }
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const validateFile = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('validateOnly', 'true');

      const response = await fetch("/api/timetable-bulk-upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult(result);
        setStep("validate");
        if (result.validation.errorRows === 0) {
          toast.success(`Validation successful! ${result.validation.validRows} rows ready to import.`);
        } else {
          toast.warning(`Validation completed with ${result.validation.errorRows} errors.`);
        }
      } else {
        toast.error(result.error || "Validation failed");
      }
    } catch (error) {
      toast.error("Failed to validate file");
    } finally {
      setLoading(false);
    }
  };

  const processUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('validateOnly', 'false');

      const response = await fetch("/api/timetable-bulk-upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult(result);
        setStep("results");
        toast.success(`Upload completed! ${result.results.successRows} timetables created.`);
      } else {
        toast.error(result.error || "Upload failed");
      }
    } catch (error) {
      toast.error("Failed to process upload");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep("upload");
    setFile(null);
    setUploadResult(null);
    setShowErrors(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeModal = () => {
    resetModal();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bulk Timetable Upload</h2>
              <p className="text-sm text-gray-600">Upload Excel or CSV file to create multiple timetables</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {step === "upload" && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Before you start:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Download the Excel template to ensure correct format</li>
                  <li>• Fill in all required fields: branch, class, academic year, subject, teacher, date, time, room</li>
                  <li>• Use exact names as they appear in the system</li>
                  <li>• Dates must be within the academic year range</li>
                  <li>• Time format: HH:MM (24-hour format)</li>
                </ul>
              </div>

              {/* Download Template */}
              <div className="flex items-center justify-center">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Excel Template
                </button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {file ? file.name : "Choose a file to upload"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Excel (.xlsx, .xls) or CSV files up to 10MB
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {file ? "Change File" : "Select File"}
                  </button>
                </div>
              </div>

              {/* Validate Button */}
              {file && (
                <div className="flex justify-center">
                  <button
                    onClick={validateFile}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Validating...
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5" />
                        Validate File
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === "validate" && uploadResult?.validation && (
            <div className="space-y-6">
              {/* Validation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{uploadResult.validation.totalRows}</div>
                  <div className="text-sm text-blue-800">Total Rows</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{uploadResult.validation.validRows}</div>
                  <div className="text-sm text-green-800">Valid Rows</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{uploadResult.validation.errorRows}</div>
                  <div className="text-sm text-red-800">Error Rows</div>
                </div>
              </div>

              {/* Validation Status */}
              <div className={`border rounded-lg p-4 ${
                uploadResult.validation.canProceed 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-center gap-3">
                  {uploadResult.validation.canProceed ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <h3 className={`font-medium ${
                      uploadResult.validation.canProceed ? "text-green-900" : "text-red-900"
                    }`}>
                      {uploadResult.validation.canProceed 
                        ? "Validation Successful!" 
                        : "Validation Failed"}
                    </h3>
                    <p className={`text-sm ${
                      uploadResult.validation.canProceed ? "text-green-800" : "text-red-800"
                    }`}>
                      {uploadResult.validation.canProceed
                        ? "All rows are valid and ready to be imported."
                        : "Please fix the errors before proceeding."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {uploadResult.validation.errors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Validation Errors</h3>
                    <button
                      onClick={() => setShowErrors(!showErrors)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showErrors ? "Hide" : "Show"} Details
                    </button>
                  </div>
                  
                  {showErrors && (
                    <div className="bg-red-50 border border-red-200 rounded-lg max-h-60 overflow-y-auto">
                      <div className="p-4 space-y-2">
                        {uploadResult.validation.errors.map((error, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium text-red-800">Row {error.row}:</span>
                            <span className="text-red-700 ml-2">
                              {error.field} - {error.message}
                              {error.value && (
                                <span className="text-red-600 ml-1">({error.value})</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep("upload")}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Upload
                </button>
                
                {uploadResult.validation.canProceed && (
                  <button
                    onClick={processUpload}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Import Timetables
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {step === "results" && uploadResult?.results && (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Completed!</h3>
                <p className="text-gray-600">Your timetables have been processed.</p>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{uploadResult.results.totalRows}</div>
                  <div className="text-sm text-blue-800">Total Rows</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{uploadResult.results.successRows}</div>
                  <div className="text-sm text-green-800">Successfully Created</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{uploadResult.results.errorRows}</div>
                  <div className="text-sm text-red-800">Failed</div>
                </div>
              </div>

              {/* Errors if any */}
              {uploadResult.results.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Creation Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {uploadResult.results.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800">
                        Row {error.row}: {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={resetModal}
                  className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Upload Another File
                </button>
                
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableBulkUploadModal;
