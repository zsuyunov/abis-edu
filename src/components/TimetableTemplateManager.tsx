"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Eye, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  MapPin,
  Building,
  Repeat,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import TimetableTemplateForm from "./TimetableTemplateForm";

interface Template {
  id: number;
  name: string;
  branch: { shortName: string };
  class: { name: string };
  academicYear: { name: string };
  subject: { name: string };
  teacher: { firstName: string; lastName: string };
  days: string[];
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName?: string;
  recurrenceType: string;
  startDate: string;
  endDate: string;
  status: string;
  _count: { timetables: number };
  createdAt: string;
}

interface GenerationPreview {
  template: {
    id: number;
    name: string;
    branch: string;
    class: string;
    academicYear: string;
    subject: string;
    teacher: string;
    days: string[];
    timeSlot: { start: string; end: string };
    room: string;
    building?: string;
  };
  preview: {
    totalDates: number;
    validDates: number;
    conflictingDates: number;
    dateRange: { start: string; end: string };
    sampleDates: string[];
    conflicts: string[];
  };
}

const TimetableTemplateManager = ({ relatedData }: { relatedData: any }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [generationPreview, setGenerationPreview] = useState<GenerationPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/timetable-templates", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        toast.error("Failed to fetch templates");
      }
    } catch (error) {
      toast.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = async (templateId: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/timetable-templates?id=${templateId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        toast.success("Template deleted successfully");
        fetchTemplates();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete template");
      }
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const handlePreview = async (templateId: number) => {
    try {
      const response = await fetch(`/api/timetable-templates/generate?templateId=${templateId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGenerationPreview(data);
        setShowPreview(true);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to preview generation");
      }
    } catch (error) {
      toast.error("Failed to preview generation");
    }
  };

  const handleGenerate = async (templateId: number, regenerate = false) => {
    setGeneratingId(templateId);
    try {
      const response = await fetch("/api/timetable-templates/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ templateId, regenerate })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Generated ${result.generatedCount} timetable entries successfully!`);
        fetchTemplates();
        setShowPreview(false);
      } else {
        if (response.status === 409) {
          // Conflict detected
          toast.error(`Conflicts detected on ${result.conflictingDates?.length || 0} dates`);
        } else {
          toast.error(result.error || "Failed to generate timetables");
        }
      }
    } catch (error) {
      toast.error("Failed to generate timetables");
    } finally {
      setGeneratingId(null);
    }
  };

  const formatDays = (days: string[]) => {
    const dayMap: { [key: string]: string } = {
      MONDAY: "Mon",
      TUESDAY: "Tue", 
      WEDNESDAY: "Wed",
      THURSDAY: "Thu",
      FRIDAY: "Fri",
      SATURDAY: "Sat",
      SUNDAY: "Sun"
    };
    return days.map(day => dayMap[day] || day).join(", ");
  };

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recurring Schedule Templates</h2>
          <p className="text-gray-600">Create templates to automatically generate recurring timetables</p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Repeat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-4">Create your first recurring schedule template</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        template.status === "ACTIVE" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {template.status}
                      </span>
                      {template._count.timetables > 0 && (
                        <span className="text-blue-600">
                          {template._count.timetables} generated
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span>{template.branch.shortName} • {template.class.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>{template.subject.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{template.teacher.firstName} {template.teacher.lastName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDays(template.days)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>
                      {formatTime(template.startTime)} - {formatTime(template.endTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>
                      {template.roomNumber}
                      {template.buildingName && ` (${template.buildingName})`}
                    </span>
                  </div>
                </div>

                {/* Date Range */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-600 mb-1">Schedule Period</div>
                  <div className="text-sm font-medium">
                    {new Date(template.startDate).toLocaleDateString()} - {new Date(template.endDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {template.recurrenceType.toLowerCase()} recurrence
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(template.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  
                  <button
                    onClick={() => handleGenerate(template.id)}
                    disabled={generatingId === template.id}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    {generatingId === template.id ? (
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Generate
                  </button>
                  
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <TimetableTemplateForm
              type={editingTemplate ? "update" : "create"}
              data={editingTemplate}
              relatedData={relatedData}
              setOpen={setShowForm}
            />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && generationPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generation Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Template Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">{generationPreview.template.name}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>Branch: {generationPreview.template.branch}</div>
                  <div>Class: {generationPreview.template.class}</div>
                  <div>Subject: {generationPreview.template.subject}</div>
                  <div>Teacher: {generationPreview.template.teacher}</div>
                  <div>Days: {formatDays(generationPreview.template.days)}</div>
                  <div>Time: {generationPreview.template.timeSlot.start} - {generationPreview.template.timeSlot.end}</div>
                </div>
              </div>

              {/* Preview Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{generationPreview.preview.validDates}</div>
                  <div className="text-sm text-green-800">Valid Dates</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{generationPreview.preview.conflictingDates}</div>
                  <div className="text-sm text-red-800">Conflicts</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{generationPreview.preview.totalDates}</div>
                  <div className="text-sm text-blue-800">Total Dates</div>
                </div>
              </div>

              {/* Status */}
              <div className={`border rounded-lg p-4 mb-6 ${
                generationPreview.preview.conflictingDates === 0 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-center gap-3">
                  {generationPreview.preview.conflictingDates === 0 ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <h4 className={`font-medium ${
                      generationPreview.preview.conflictingDates === 0 ? "text-green-900" : "text-red-900"
                    }`}>
                      {generationPreview.preview.conflictingDates === 0 
                        ? "Ready to Generate!" 
                        : "Conflicts Detected"}
                    </h4>
                    <p className={`text-sm ${
                      generationPreview.preview.conflictingDates === 0 ? "text-green-800" : "text-red-800"
                    }`}>
                      {generationPreview.preview.conflictingDates === 0
                        ? `${generationPreview.preview.validDates} timetable entries will be created.`
                        : `${generationPreview.preview.conflictingDates} dates have scheduling conflicts.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample Dates */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Sample Dates (First 10)</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {generationPreview.preview.sampleDates.map((date, index) => (
                    <div key={index} className="bg-gray-100 rounded px-3 py-2 text-sm text-center">
                      {new Date(date).toLocaleDateString()}
                    </div>
                  ))}
                </div>
              </div>

              {/* Conflicts */}
              {generationPreview.preview.conflicts.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-red-900 mb-3">Conflicting Dates</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {generationPreview.preview.conflicts.map((date, index) => (
                      <div key={index} className="bg-red-100 rounded px-3 py-2 text-sm text-center text-red-800">
                        {new Date(date).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                <div className="flex gap-3">
                  {generationPreview.preview.conflictingDates === 0 ? (
                    <button
                      onClick={() => handleGenerate(generationPreview.template.id)}
                      disabled={generatingId === generationPreview.template.id}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {generatingId === generationPreview.template.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Generate Timetables
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGenerate(generationPreview.template.id, true)}
                      disabled={generatingId === generationPreview.template.id}
                      className="flex items-center gap-2 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {generatingId === generationPreview.template.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Force Generate (Skip Conflicts)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableTemplateManager;
