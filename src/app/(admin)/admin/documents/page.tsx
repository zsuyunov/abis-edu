"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import DocumentForm from "@/components/forms/DocumentForm";
import FilePreview from "@/components/FilePreview";
import DocumentTypeChart from "@/components/charts/DocumentTypeChart";
import DocumentUsageChart from "@/components/charts/DocumentUsageChart";
import { useCachedBranches, useCachedClasses } from "@/hooks/usePowerfulApi";

interface Document {
  id: number;
  title: string;
  description?: string;
  documentType: string;
  status: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  audienceType: string;
  tags: string[];
  keywords: string[];
  expiryDate?: string;
  createdAt: string;
  createdBy: string;
  branch?: {
    shortName: string;
  };
  class?: {
    name: string;
  };
  academicYear?: {
    name: string;
  };
  assignments: Array<{
    student?: {
      firstName: string;
      lastName: string;
      studentId: string;
    };
    teacher?: {
      firstName: string;
      lastName: string;
      teacherId: string;
    };
  }>;
  downloads: Array<{
    downloadedBy: string;
    userType: string;
    downloadedAt: string;
  }>;
  versions: Array<{
    versionNumber: number;
    fileName: string;
    changeLog?: string;
    createdBy: string;
    createdAt: string;
  }>;
}

interface FilterData {
  branches: { id: number; shortName: string }[];
  classes: { id: number; name: string; branchId: number }[];
  academicYears: { id: number; name: string }[];
}

const DocumentsManagementPage = () => {
  // ULTRA-INSTANT cached data hooks
  const { data: branchesData } = useCachedBranches();
  const { data: classesData } = useCachedClasses();
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedAudienceType, setSelectedAudienceType] = useState<string>("ALL");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDocument, setExpandedDocument] = useState<number | null>(null);
  
  // Modal states
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState<{
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  } | null>(null);
  
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Get filter data from cached hooks
  const filterData = {
    branches: branchesData?.branches || [],
    classes: classesData?.classes || [],
    academicYears: [] as { id: number; name: string }[], // Will be populated from classes
  };

  // Filter classes based on selected branch
  useEffect(() => {
    if (selectedBranch && filterData.classes) {
      const filtered = filterData.classes.filter(
        (cls: any) => cls.branchId === parseInt(selectedBranch) && cls.status === "ACTIVE"
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses([]);
    }
  }, [selectedBranch, filterData.classes]);

  // Clear class selection when branch changes
  useEffect(() => {
    setSelectedClass("");
  }, [selectedBranch]);

  // Fetch documents and analytics
  useEffect(() => {
    fetchDocuments();
    fetchAnalytics();
  }, [selectedBranch, selectedAudienceType, selectedClass, selectedAcademicYear, selectedDocumentType, selectedStatus, searchKeyword, startDate, endDate]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append("branchId", selectedBranch);
      if (selectedAudienceType !== "ALL") params.append("audienceType", selectedAudienceType);
      if (selectedClass) params.append("classId", selectedClass);
      if (selectedAcademicYear) params.append("academicYearId", selectedAcademicYear);
      if (selectedDocumentType !== "ALL") params.append("documentType", selectedDocumentType);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (searchKeyword) params.append("searchKeyword", searchKeyword);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/documents?${params}`);
      const documentsData = await response.json();

      setDocuments(documentsData);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append("branchId", selectedBranch);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/documents/analytics?${params}`);
      const analyticsData = await response.json();

      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const handleCreateDocument = () => {
    setEditingDocument(null);
    setShowDocumentForm(true);
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setShowDocumentForm(true);
  };

  const handleFormSuccess = () => {
    fetchDocuments();
    fetchAnalytics();
  };

  const handlePreviewFile = (document: Document) => {
    setShowPreview({
      fileName: document.fileName,
      filePath: document.filePath,
      fileType: document.fileType,
      fileSize: document.fileSize,
    });
  };

  const handleDownloadFile = async (document: Document) => {
    try {
      // Track download
      await fetch(`/api/documents/${document.id}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          downloadedBy: "admin", // In real app, get from session
          userType: "ADMIN",
        }),
      });

      // Trigger download
      const link = window.document.createElement('a');
      link.href = document.filePath;
      link.download = document.fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const exportReport = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append("branchId", selectedBranch);
      if (selectedAudienceType !== "ALL") params.append("audienceType", selectedAudienceType);
      if (selectedClass) params.append("classId", selectedClass);
      if (selectedAcademicYear) params.append("academicYearId", selectedAcademicYear);
      if (selectedDocumentType !== "ALL") params.append("documentType", selectedDocumentType);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (searchKeyword) params.append("searchKeyword", searchKeyword);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("format", "csv");

      const response = await fetch(`/api/documents/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `documents_export_${new Date().toISOString().split('T')[0]}.csv`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Export failed");
      }
    } catch (error) {
      console.error("Error exporting documents:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "ARCHIVED": return "bg-gray-100 text-gray-800";
      case "EXPIRED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getAudienceBadge = (audienceType: string) => {
    switch (audienceType) {
      case "TEACHERS": return "bg-blue-100 text-blue-800";
      case "STUDENTS": return "bg-green-100 text-green-800";
      case "MIXED": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDocumentType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAssignmentSummary = (doc: Document) => {
    const studentCount = doc.assignments.filter(a => a.student).length;
    const teacherCount = doc.assignments.filter(a => a.teacher).length;
    
    if (doc.audienceType === "STUDENTS") {
      return `${studentCount} student${studentCount !== 1 ? 's' : ''}`;
    } else if (doc.audienceType === "TEACHERS") {
      return `${teacherCount} teacher${teacherCount !== 1 ? 's' : ''}`;
    } else {
      return `${studentCount} student${studentCount !== 1 ? 's' : ''}, ${teacherCount} teacher${teacherCount !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Documents Management</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCreateDocument}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Image src="/plus.png" alt="add" width={16} height={16} />
            Create Document
          </button>
          <button 
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              showAnalytics 
                ? 'bg-purple-500 text-white hover:bg-purple-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Image src="/chart.png" alt="analytics" width={16} height={16} />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
          <button 
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            <Image src="/export.png" alt="export" width={16} height={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search documents by title, description, tags, or keywords..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-md text-sm"
          />
          <Image 
            src="/search.png" 
            alt="search" 
            width={16} 
            height={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Documents</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Branches</option>
              {filterData.branches?.map((branch: { id: number; shortName: string }) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName}
                </option>
              )) || null}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select
              value={selectedAudienceType}
              onChange={(e) => setSelectedAudienceType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Audiences</option>
              <option value="TEACHERS">Teachers</option>
              <option value="STUDENTS">Students</option>
              <option value="MIXED">Mixed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              disabled={!selectedBranch}
            >
              <option value="">All Classes</option>
              {filteredClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Years</option>
              {filterData.academicYears?.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              )) || null}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="LESSON_PLAN">Lesson Plan</option>
              <option value="EXAM_GUIDE">Exam Guide</option>
              <option value="HOMEWORK">Homework</option>
              <option value="ASSIGNMENT">Assignment</option>
              <option value="NOTICE">Notice</option>
              <option value="SYLLABUS">Syllabus</option>
              <option value="STUDY_MATERIAL">Study Material</option>
              <option value="REFERENCE">Reference</option>
              <option value="FORM">Form</option>
              <option value="POLICY">Policy</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* ANALYTICS DASHBOARD */}
      {showAnalytics && analytics && !loading && (
        <div className="space-y-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h3>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalDocuments}</div>
              <div className="text-sm text-blue-700">Total Documents</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{analytics.totalDownloads}</div>
              <div className="text-sm text-green-700">Total Downloads</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{analytics.avgDownloadsPerDoc}</div>
              <div className="text-sm text-purple-700">Avg Downloads/Doc</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(analytics.totalFileSize / (1024 * 1024))}MB
              </div>
              <div className="text-sm text-orange-700">Total Storage</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DocumentTypeChart 
              data={analytics.typeStats}
              totalDocuments={analytics.totalDocuments}
            />
            <DocumentUsageChart 
              uploadsData={analytics.uploadsData}
              downloadsData={analytics.downloadsData}
              totalDocuments={analytics.totalDocuments}
              totalDownloads={analytics.totalDownloads}
            />
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading documents...</p>
        </div>
      )}

      {/* DOCUMENTS LIST */}
      {!loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Documents List ({documents.length})</h3>
          </div>
          
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No documents found matching the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedDocument(
                      expandedDocument === document.id ? null : document.id
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{document.title}</h4>
                          <p className="text-sm text-gray-600">
                            {formatDocumentType(document.documentType)} • {formatFileSize(document.fileSize)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {document.branch?.shortName || "All Branches"} 
                            {document.class && ` • ${document.class.name}`}
                            {document.academicYear && ` • ${document.academicYear.name}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getAudienceBadge(document.audienceType)}`}>
                            {document.audienceType}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">{getAssignmentSummary(document)}</div>
                        </div>

                        <div className="text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(document.status)}`}>
                            {document.status}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                            }).format(new Date(document.createdAt))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDocument(document);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full" 
                            title="Edit document"
                          >
                            <Image src="/edit.png" alt="edit" width={16} height={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewFile(document);
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-100 rounded-full" 
                            title="Preview file"
                          >
                            <Image src="/view.png" alt="preview" width={16} height={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(document);
                            }}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-full" 
                            title="Download"
                          >
                            <Image src="/download.png" alt="download" width={16} height={16} />
                          </button>
                          <Image 
                            src="/down.png" 
                            alt="expand" 
                            width={16} 
                            height={16}
                            className={`transition-transform ${
                              expandedDocument === document.id ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {expandedDocument === document.id && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Document Details */}
                        <div>
                          <h5 className="font-medium mb-3">Document Details</h5>
                          <div className="space-y-3">
                            {document.description && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Description:</label>
                                <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                              </div>
                            )}
                            
                            <div>
                              <label className="text-sm font-medium text-gray-700">File:</label>
                              <p className="text-sm text-gray-600">{document.fileName}</p>
                            </div>

                            {document.tags.length > 0 && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Tags:</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {document.tags.map((tag, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {document.expiryDate && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Expires:</label>
                                <p className="text-sm text-gray-600">
                                  {new Intl.DateTimeFormat("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  }).format(new Date(document.expiryDate))}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Version History & Downloads */}
                        <div>
                          <h5 className="font-medium mb-3">Activity</h5>
                          <div className="space-y-3">
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Downloads ({document.downloads.length})</h6>
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {document.downloads.slice(0, 5).map((download, index) => (
                                  <div key={index} className="text-xs text-gray-600 flex justify-between">
                                    <span>{download.userType.toLowerCase()}: {download.downloadedBy}</span>
                                    <span>{new Intl.DateTimeFormat("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }).format(new Date(download.downloadedAt))}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Versions ({document.versions.length})</h6>
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {document.versions.map((version) => (
                                  <div key={version.versionNumber} className="text-xs text-gray-600">
                                    <div className="flex justify-between">
                                      <span>v{version.versionNumber} - {version.fileName}</span>
                                      <span>{new Intl.DateTimeFormat("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      }).format(new Date(version.createdAt))}</span>
                                    </div>
                                    {version.changeLog && (
                                      <div className="text-gray-500 italic">{version.changeLog}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DOCUMENT FORM MODAL */}
      {showDocumentForm && (
        <DocumentForm
          type={editingDocument ? "update" : "create"}
          data={editingDocument}
          onClose={() => setShowDocumentForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* FILE PREVIEW MODAL */}
      {showPreview && (
        <FilePreview
          fileName={showPreview.fileName}
          filePath={showPreview.filePath}
          fileType={showPreview.fileType}
          fileSize={showPreview.fileSize}
          onClose={() => setShowPreview(null)}
          onDownload={() => {
            const link = window.document.createElement('a');
            link.href = showPreview.filePath;
            link.download = showPreview.fileName;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
          }}
        />
      )}
    </div>
  );
};

export default DocumentsManagementPage;
