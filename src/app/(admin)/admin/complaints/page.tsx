"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ComplaintCategoryChart from "@/components/charts/ComplaintCategoryChart";
import ComplaintStatusChart from "@/components/charts/ComplaintStatusChart";
import ComplaintTimelineChart from "@/components/charts/ComplaintTimelineChart";
import { useCachedBranches, useCachedClasses } from "@/hooks/usePowerfulApi";

interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  senderType: string;
  createdAt: string;
  resolvedAt?: string;
  student?: {
    firstName: string;
    lastName: string;
    studentId: string;
  };
  parent?: {
    firstName: string;
    lastName: string;
    parentId: string;
  };
  teacher?: {
    firstName: string;
    lastName: string;
    teacherId: string;
  };
  branch: {
    shortName: string;
  };
  class?: {
    name: string;
  };
  subject?: {
    name: string;
  };
  attachments: Array<{
    id: number;
    fileName: string;
    fileType: string;
    fileSize: number;
  }>;
  statusHistory: Array<{
    fromStatus: string | null;
    toStatus: string;
    comment: string;
    changedBy: string;
    changedByRole: string;
    createdAt: string;
  }>;
}

interface ComplaintAnalytics {
  totalComplaints: number;
  categoryStats: Record<string, number>;
  statusStats: Record<string, number>;
  priorityStats: Record<string, number>;
  senderTypeStats: Record<string, number>;
  timelineData: Record<string, number>;
  resolutionRate: number;
  avgResolutionTime: number;
  complaints: Complaint[];
}

interface FilterData {
  branches: { id: number; shortName: string }[];
  classes: { id: number; name: string; branchId: number }[];
}

const ComplaintsManagementPage = () => {
  // ULTRA-INSTANT cached data hooks
  const { data: branchesData } = useCachedBranches();
  const { data: classesData } = useCachedClasses();
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedSenderType, setSelectedSenderType] = useState<string>("ALL");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const [complaintsData, setComplaintsData] = useState<ComplaintAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedComplaint, setExpandedComplaint] = useState<number | null>(null);
  const [statusUpdateModal, setStatusUpdateModal] = useState<{
    isOpen: boolean;
    complaintId: number | null;
    currentStatus: string;
  }>({
    isOpen: false,
    complaintId: null,
    currentStatus: "",
  });

  const [statusComment, setStatusComment] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);

  // Get filter data from cached hooks
  const filterData = {
    branches: branchesData?.branches || [],
    classes: classesData?.classes || [],
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

  // Fetch complaints and analytics
  useEffect(() => {
    fetchComplaintsData();
  }, [selectedBranch, selectedSenderType, selectedClass, selectedCategory, selectedPriority, selectedStatus, startDate, endDate]);

  const fetchComplaintsData = async () => {
    setLoading(true);
    try {
      // Fetch complaints
      const complaintsParams = new URLSearchParams();
      if (selectedBranch) complaintsParams.append("branchId", selectedBranch);
      if (selectedSenderType !== "ALL") complaintsParams.append("senderType", selectedSenderType);
      if (selectedClass) complaintsParams.append("classId", selectedClass);
      if (selectedCategory !== "ALL") complaintsParams.append("category", selectedCategory);
      if (selectedPriority !== "ALL") complaintsParams.append("priority", selectedPriority);
      if (selectedStatus !== "ALL") complaintsParams.append("status", selectedStatus);
      if (startDate) complaintsParams.append("startDate", startDate);
      if (endDate) complaintsParams.append("endDate", endDate);

      // Fetch analytics
      const analyticsParams = new URLSearchParams();
      if (selectedBranch) analyticsParams.append("branchId", selectedBranch);
      if (startDate) analyticsParams.append("startDate", startDate);
      if (endDate) analyticsParams.append("endDate", endDate);

      const [complaintsResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/complaints?${complaintsParams}`),
        fetch(`/api/complaints/analytics?${analyticsParams}`),
      ]);

      const complaints = await complaintsResponse.json();
      const analytics = await analyticsResponse.json();

      setComplaintsData({
        ...analytics,
        complaints: complaints,
      });
    } catch (error) {
      console.error("Error fetching complaints data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdateModal.complaintId || !newStatus || !statusComment) return;

    try {
      const response = await fetch(`/api/complaints/${statusUpdateModal.complaintId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newStatus,
          comment: statusComment,
          changedBy: "admin", // In a real app, get from session
          changedByRole: "ADMIN",
        }),
      });

      if (response.ok) {
        setStatusUpdateModal({ isOpen: false, complaintId: null, currentStatus: "" });
        setStatusComment("");
        setNewStatus("");
        fetchComplaintsData(); // Refresh data
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const exportReport = () => {
    // TODO: Implement Excel/PDF export
    console.log("Exporting complaints report...");
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-100 text-red-800";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "LOW": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "IN_REVIEW": return "bg-blue-100 text-blue-800";
      case "RESOLVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCategory = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSenderName = (complaint: Complaint) => {
    if (complaint.student) {
      return `${complaint.student.firstName} ${complaint.student.lastName} (${complaint.student.studentId})`;
    }
    if (complaint.parent) {
      return `${complaint.parent.firstName} ${complaint.parent.lastName} (${complaint.parent.parentId})`;
    }
    if (complaint.teacher) {
      return `${complaint.teacher.firstName} ${complaint.teacher.lastName} (${complaint.teacher.teacherId})`;
    }
    return "Unknown";
  };

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Complaints Management</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            <Image src="/export.png" alt="export" width={16} height={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Complaints</h2>
        
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Sender Type</label>
            <select
              value={selectedSenderType}
              onChange={(e) => setSelectedSenderType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Senders</option>
              <option value="STUDENT">Students</option>
              <option value="PARENT">Parents</option>
              <option value="TEACHER">Teachers</option>
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
              {filteredClasses.map((cls: { id: number; name: string; branchId: number; status: string }) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Categories</option>
              <option value="ACADEMIC">Academic</option>
              <option value="DISCIPLINE">Discipline</option>
              <option value="FACILITIES">Facilities</option>
              <option value="TEACHER_BEHAVIOR">Teacher Behavior</option>
              <option value="STUDENT_BEHAVIOR">Student Behavior</option>
              <option value="ADMINISTRATIVE">Administrative</option>
              <option value="TECHNICAL">Technical</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
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
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
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

      {/* ANALYTICS CHARTS */}
      {!loading && complaintsData && (
        <div className="space-y-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h3>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{complaintsData.totalComplaints}</div>
              <div className="text-sm text-blue-700">Total Complaints</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{complaintsData.resolutionRate}%</div>
              <div className="text-sm text-green-700">Resolution Rate</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{complaintsData.avgResolutionTime}</div>
              <div className="text-sm text-purple-700">Avg Resolution (days)</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {complaintsData.statusStats.PENDING || 0}
              </div>
              <div className="text-sm text-orange-700">Pending Review</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComplaintCategoryChart 
              data={complaintsData.categoryStats}
              totalComplaints={complaintsData.totalComplaints}
            />
            <ComplaintStatusChart 
              data={complaintsData.statusStats}
              totalComplaints={complaintsData.totalComplaints}
            />
          </div>

          {/* Timeline Chart */}
          <ComplaintTimelineChart 
            data={complaintsData.timelineData}
            totalComplaints={complaintsData.totalComplaints}
          />
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading complaints data...</p>
        </div>
      )}

      {/* COMPLAINTS TABLE */}
      {!loading && complaintsData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Complaints List ({complaintsData.complaints.length})</h3>
          </div>
          
          {complaintsData.complaints.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No complaints found matching the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaintsData.complaints.map((complaint: Complaint) => (
                <div key={complaint.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedComplaint(
                      expandedComplaint === complaint.id ? null : complaint.id
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{complaint.title}</h4>
                          <p className="text-sm text-gray-600">
                            From: {getSenderName(complaint)} ({complaint.senderType.toLowerCase()})
                          </p>
                          <p className="text-sm text-gray-500">
                            Branch: {complaint.branch.shortName} 
                            {complaint.class && ` • Class: ${complaint.class.name}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">{formatCategory(complaint.category)}</div>
                        </div>

                        <div className="text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                            {complaint.status.replace('_', ' ')}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                            }).format(new Date(complaint.createdAt))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusUpdateModal({
                                isOpen: true,
                                complaintId: complaint.id,
                                currentStatus: complaint.status,
                              });
                              setNewStatus(complaint.status);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                            title="Update status"
                          >
                            <Image src="/edit.png" alt="edit" width={16} height={16} />
                          </button>
                          <Image 
                            src="/down.png" 
                            alt="expand" 
                            width={16} 
                            height={16}
                            className={`transition-transform ${
                              expandedComplaint === complaint.id ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {expandedComplaint === complaint.id && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Complaint Details */}
                        <div>
                          <h5 className="font-medium mb-3">Complaint Details</h5>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Description:</label>
                              <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                            </div>
                            
                            {complaint.subject && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Related Subject:</label>
                                <p className="text-sm text-gray-600">{complaint.subject.name}</p>
                              </div>
                            )}

                            {complaint.attachments.length > 0 && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Attachments:</label>
                                <div className="mt-1 space-y-1">
                                  {complaint.attachments.map((attachment: { id: number; fileName: string; fileType: string; fileSize: number }) => (
                                    <div key={attachment.id} className="flex items-center gap-2 text-sm text-blue-600">
                                      <Image src="/attachment.png" alt="file" width={12} height={12} />
                                      {attachment.fileName} ({Math.round(attachment.fileSize / 1024)}KB)
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status History */}
                        <div>
                          <h5 className="font-medium mb-3">Status History</h5>
                          <div className="space-y-2">
                            {complaint.statusHistory.map((history: { fromStatus: string | null; toStatus: string; comment: string; changedBy: string; changedByRole: string; createdAt: string }, index: number) => (
                              <div key={index} className="p-2 bg-gray-50 rounded-md">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(history.toStatus)}`}>
                                      {history.fromStatus ? `${history.fromStatus} → ` : ''}{history.toStatus}
                                    </span>
                                    <p className="text-xs text-gray-600 mt-1">{history.comment}</p>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Intl.DateTimeFormat("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }).format(new Date(history.createdAt))}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  By: {history.changedBy} ({history.changedByRole})
                                </div>
                              </div>
                            ))}
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

      {/* STATUS UPDATE MODAL */}
      {statusUpdateModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Complaint Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment (Required)</label>
                <textarea
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Enter reason for status change..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setStatusUpdateModal({ isOpen: false, complaintId: null, currentStatus: "" });
                  setStatusComment("");
                  setNewStatus("");
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={!newStatus || !statusComment || statusComment.length < 10}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsManagementPage;
