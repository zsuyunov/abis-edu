"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Archive, 
  RotateCcw, 
  Trash2, 
  Edit, 
  BookOpen, 
  Users, 
  ChevronDown,
  X,
  Save,
  UserPlus
} from "lucide-react";
import { toast } from "react-toastify";
import SubjectAssignmentModal from "@/components/SubjectAssignmentModal";
import StudentAssignmentModal from "@/components/StudentAssignmentModal";
import ElectiveClassManager from "@/components/ElectiveClassManager";

interface ElectiveGroup {
  id: number;
  name: string;
  description?: string;
  status: string;
  branch: {
    id: number;
    shortName: string;
    legalName: string;
  };
  academicYear: {
    id: number;
    name: string;
    isCurrent: boolean;
  };
  electiveSubjects?: Array<{
    id: number;
    subject: {
      id: number;
      name: string;
    };
    teacherIds: string[];
    _count: {
      studentAssignments: number;
    };
  }>;
  createdAt: string;
}

interface Branch {
  id: number;
  shortName: string;
  legalName: string;
}

interface AcademicYear {
  id: number;
  name: string;
  isCurrent: boolean;
}

const ElectivesPage = () => {
  const [electiveGroups, setElectiveGroups] = useState<ElectiveGroup[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ElectiveGroup | null>(null);
  const [selectedElectiveSubject, setSelectedElectiveSubject] = useState<any>(null);
  const [activeView, setActiveView] = useState<'groups' | 'classes'>('groups');

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    branchId: "",
    academicYearId: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedBranch || selectedAcademicYear) {
      fetchElectiveGroups();
    }
  }, [selectedBranch, selectedAcademicYear, statusFilter]);

  const fetchInitialData = async () => {
    try {
      const [branchesRes, academicYearsRes] = await Promise.all([
        fetch("/api/branches"),
        fetch("/api/academic-years")
      ]);

      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        setBranches(branchesData.data || branchesData);
      }

      if (academicYearsRes.ok) {
        const yearsData = await academicYearsRes.json();
        const years = yearsData.data || yearsData;
        setAcademicYears(years);
        
        // Auto-select current academic year
        const currentYear = years.find((y: AcademicYear) => y.isCurrent);
        if (currentYear) {
          setSelectedAcademicYear(currentYear.id.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const fetchElectiveGroups = async () => {
    if (!selectedBranch && !selectedAcademicYear) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBranch) params.append("branchId", selectedBranch);
      if (selectedAcademicYear) params.append("academicYearId", selectedAcademicYear);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/admin/electives?${params}`);
      if (response.ok) {
        const data = await response.json();
        setElectiveGroups(data.data.electiveGroups || []);
      } else {
        toast.error("Failed to fetch elective groups");
      }
    } catch (error) {
      console.error("Error fetching elective groups:", error);
      toast.error("Error loading elective groups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!formData.name || !formData.branchId || !formData.academicYearId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/admin/electives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Elective group created successfully!");
        setShowCreateModal(false);
        setFormData({ name: "", description: "", branchId: "", academicYearId: "" });
        fetchElectiveGroups();
      } else {
        toast.error(data.error || "Failed to create elective group");
      }
    } catch (error) {
      console.error("Error creating elective group:", error);
      toast.error("Error creating elective group");
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;

    try {
      const response = await fetch(`/api/admin/electives/${selectedGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Elective group updated successfully!");
        setShowEditModal(false);
        setSelectedGroup(null);
        fetchElectiveGroups();
      } else {
        toast.error(data.error || "Failed to update elective group");
      }
    } catch (error) {
      console.error("Error updating elective group:", error);
      toast.error("Error updating elective group");
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm("Are you sure you want to archive this elective group?")) return;

    try {
      const response = await fetch(`/api/admin/electives/${id}/archive`, {
        method: "POST"
      });

      if (response.ok) {
        toast.success("Elective group archived successfully!");
        fetchElectiveGroups();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to archive elective group");
      }
    } catch (error) {
      console.error("Error archiving elective group:", error);
      toast.error("Error archiving elective group");
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/electives/${id}/restore`, {
        method: "POST"
      });

      if (response.ok) {
        toast.success("Elective group restored successfully!");
        fetchElectiveGroups();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to restore elective group");
      }
    } catch (error) {
      console.error("Error restoring elective group:", error);
      toast.error("Error restoring elective group");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this elective group? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/admin/electives/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Elective group deleted successfully!");
        fetchElectiveGroups();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete elective group");
      }
    } catch (error) {
      console.error("Error deleting elective group:", error);
      toast.error("Error deleting elective group");
    }
  };

  const openEditModal = (group: ElectiveGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      branchId: group.branch.id.toString(),
      academicYearId: group.academicYear.id.toString()
    });
    setShowEditModal(true);
  };

  const openSubjectsModal = (group: ElectiveGroup) => {
    setSelectedGroup(group);
    setShowSubjectsModal(true);
  };

  const filteredGroups = electiveGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Elective Management</h1>
          <p className="text-gray-600">Create and manage elective groups, assign subjects and students</p>
        </div>

        {/* View Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveView('groups')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeView === 'groups'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-5 h-5 inline mr-2" />
              Elective Groups
            </button>
            <button
              onClick={() => setActiveView('classes')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeView === 'classes'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Elective Classes
            </button>
          </div>
        </div>

        {activeView === 'groups' && (
          <>
            {/* Filters and Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Branch Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.shortName} - {branch.legalName}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.isCurrent && "(Current)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!selectedBranch || !selectedAcademicYear}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Elective Group
            </button>
          </div>
        </div>

        {/* Elective Groups List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500 font-medium">No elective groups found</p>
            <p className="text-gray-400 mt-2">
              {!selectedBranch || !selectedAcademicYear
                ? "Please select a branch and academic year to view elective groups"
                : "Create your first elective group to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{group.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          group.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : group.status === "ARCHIVED"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {group.status}
                      </span>
                    </div>
                    {group.description && (
                      <p className="text-gray-600 mb-3">{group.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        Branch: {group.branch.shortName}
                      </span>
                      <span>Academic Year: {group.academicYear.name}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.electiveSubjects?.length || 0} Subject(s)
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openSubjectsModal(group)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                      title="Assign Subjects"
                    >
                      <BookOpen className="w-4 h-4" />
                      Subjects
                    </button>
                    <button
                      onClick={() => openEditModal(group)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {group.status === "ARCHIVED" ? (
                      <button
                        onClick={() => handleRestore(group.id)}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        title="Restore"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleArchive(group.id)}
                        className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subjects List */}
                {group.electiveSubjects && group.electiveSubjects.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.electiveSubjects.map((electiveSubject) => (
                        <div
                          key={electiveSubject.id}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {electiveSubject.subject.name}
                            </h4>
                            <button
                              onClick={() => {
                                setSelectedGroup(group);
                                setSelectedElectiveSubject(electiveSubject);
                                setShowStudentsModal(true);
                              }}
                              className="px-3 py-1 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3" />
                              Assign Students
                            </button>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {electiveSubject._count.studentAssignments} Student(s)
                            </span>
                            <span>{electiveSubject.teacherIds.length} Teacher(s)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {showCreateModal ? "Create" : "Edit"} Elective Group
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setFormData({ name: "", description: "", branchId: "", academicYearId: "" });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Grade 10 Electives"
                  />
                </div>

                {showCreateModal && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.branchId}
                        onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Branch</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.shortName} - {branch.legalName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Academic Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.academicYearId}
                        onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Academic Year</option>
                        {academicYears.map((year) => (
                          <option key={year.id} value={year.id}>
                            {year.name} {year.isCurrent && "(Current)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Optional description..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setFormData({ name: "", description: "", branchId: "", academicYearId: "" });
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={showCreateModal ? handleCreateGroup : handleUpdateGroup}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {showCreateModal ? "Create" : "Update"}
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {activeView === 'classes' && selectedBranch && selectedAcademicYear && (
          <ElectiveClassManager
            branchId={parseInt(selectedBranch)}
            academicYearId={parseInt(selectedAcademicYear)}
          />
        )}

        {activeView === 'classes' && (!selectedBranch || !selectedAcademicYear) && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500 font-medium">Select Branch and Academic Year</p>
            <p className="text-gray-400 mt-2">
              Please select a branch and academic year to manage elective classes
            </p>
          </div>
        )}

        {/* Subject Assignment Modal */}
        {showSubjectsModal && selectedGroup && (
          <SubjectAssignmentModal
            isOpen={showSubjectsModal}
            onClose={() => {
              setShowSubjectsModal(false);
              setSelectedGroup(null);
            }}
            electiveGroup={selectedGroup}
            onSuccess={() => {
              fetchElectiveGroups();
            }}
          />
        )}

        {/* Student Assignment Modal */}
        {showStudentsModal && selectedGroup && selectedElectiveSubject && (
          <StudentAssignmentModal
            isOpen={showStudentsModal}
            onClose={() => {
              setShowStudentsModal(false);
              setSelectedElectiveSubject(null);
            }}
            electiveSubject={selectedElectiveSubject}
            electiveGroup={selectedGroup}
            onSuccess={() => {
              fetchElectiveGroups();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ElectivesPage;

