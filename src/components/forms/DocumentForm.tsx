"use client";

import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { createDocument, updateDocument } from "@/lib/actions";
import ImageKitUpload from "../ImageKitUpload";
import Image from "next/image";

interface DocumentFormProps {
  type: "create" | "update";
  data?: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface FilterData {
  branches: { id: number; shortName: string }[];
  classes: { id: number; name: string; branchId: number }[];
  academicYears: { id: number; name: string }[];
  teachers: { id: string; firstName: string; lastName: string; teacherId: string; branchId: number }[];
  students: { id: string; firstName: string; lastName: string; studentId: string; classId: number }[];
}

const DocumentForm = ({ type, data, onClose, onSuccess }: DocumentFormProps) => {
  const [state, formAction] = useFormState(
    type === "create" ? createDocument : updateDocument,
    {
      success: false,
      error: false,
    }
  );

  const [filterData, setFilterData] = useState<FilterData>({
    branches: [],
    classes: [],
    academicYears: [],
    teachers: [],
    students: [],
  });

  // Form state
  const [formData, setFormData] = useState({
    title: data?.title || "",
    description: data?.description || "",
    documentType: data?.documentType || "LESSON_PLAN",
    audienceType: data?.audienceType || "STUDENTS",
    branchId: data?.branchId || "",
    classId: data?.classId || "",
    academicYearId: data?.academicYearId || "",
    assignToEntireClass: false,
    teacherIds: [] as string[],
    studentIds: [] as string[],
    tags: data?.tags || [],
    keywords: data?.keywords || [],
    expiryDate: data?.expiryDate ? new Date(data.expiryDate).toISOString().split('T')[0] : "",
  });

  const [fileData, setFileData] = useState({
    fileName: data?.fileName || "",
    filePath: data?.filePath || "",
    fileType: data?.fileType || "",
    fileSize: data?.fileSize || 0,
  });

  const [currentTag, setCurrentTag] = useState("");
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);

  // Fetch filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [branchesRes, classesRes, academicYearsRes, teachersRes, studentsRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/classes"),
          fetch("/api/academic-years"),
          fetch("/api/teachers"),
          fetch("/api/students"),
        ]);

        const branches = await branchesRes.json();
        const classes = await classesRes.json();
        const academicYears = await academicYearsRes.json();
        const teachers = await teachersRes.json();
        const students = await studentsRes.json();

        setFilterData({ branches, classes, academicYears, teachers, students });
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };

    fetchFilterData();
  }, []);

  // Filter classes based on selected branch
  useEffect(() => {
    if (formData.branchId && filterData.classes) {
      const filtered = filterData.classes.filter(
        (cls: any) => cls.branchId === parseInt(formData.branchId) && cls.status === "ACTIVE"
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses([]);
    }
  }, [formData.branchId, filterData.classes]);

  // Filter teachers based on selected branch
  useEffect(() => {
    if (formData.branchId && filterData.teachers) {
      const filtered = filterData.teachers.filter(
        (teacher: any) => teacher.branchId === parseInt(formData.branchId) && teacher.status === "ACTIVE"
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers([]);
    }
  }, [formData.branchId, filterData.teachers]);

  // Filter students based on selected class
  useEffect(() => {
    if (formData.classId && filterData.students) {
      const filtered = filterData.students.filter(
        (student: any) => student.classId === parseInt(formData.classId) && student.status === "ACTIVE"
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  }, [formData.classId, filterData.students]);

  // Clear dependent selections when parent changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, classId: "", teacherIds: [], studentIds: [] }));
  }, [formData.branchId]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, studentIds: [] }));
  }, [formData.classId]);

  // Handle form submission
  useEffect(() => {
    if (state.success) {
      onSuccess();
      onClose();
    }
  }, [state, onSuccess, onClose]);

  const handleFileSelect = (result: any) => {
    setFileData({
      fileName: result.name,
      filePath: result.url,
      fileType: result.fileType,
      fileSize: result.size,
    });
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addKeyword = () => {
    if (currentKeyword.trim() && !formData.keywords.includes(currentKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, currentKeyword.trim()]
      }));
      setCurrentKeyword("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  const handleTeacherSelection = (teacherId: string, selected: boolean) => {
    setFormData(prev => ({
      ...prev,
      teacherIds: selected 
        ? [...prev.teacherIds, teacherId]
        : prev.teacherIds.filter(id => id !== teacherId)
    }));
  };

  const handleStudentSelection = (studentId: string, selected: boolean) => {
    setFormData(prev => ({
      ...prev,
      studentIds: selected 
        ? [...prev.studentIds, studentId]
        : prev.studentIds.filter(id => id !== studentId)
    }));
  };

  const handleSubmit = (formDataObj: FormData) => {
    // Add all form data
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formDataObj.append(key, JSON.stringify(value));
      } else {
        formDataObj.append(key, value.toString());
      }
    });

    // Add file data
    Object.entries(fileData).forEach(([key, value]) => {
      formDataObj.append(key, value.toString());
    });

    // Add system data
    formDataObj.append("createdBy", "admin"); // In real app, get from session
    if (type === "update" && data?.id) {
      formDataObj.append("id", data.id.toString());
    }

    formAction(formDataObj);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {type === "create" ? "Create Document" : "Update Document"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Image src="/close.png" alt="close" width={16} height={16} />
            </button>
          </div>

          <form action={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type *
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Optional description of the document..."
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Document File *
              </label>
              <ImageKitUpload
                onSuccess={handleFileSelect}
                onError={(error) => {
                  console.error("Document upload failed:", error);
                }}
              />
              {fileData.fileName && (
                <p className="text-xs text-green-600 mt-2">
                  File uploaded: {fileData.fileName} ✓
                </p>
              )}
            </div>

            {/* Targeting */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Document Targeting</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Audience Type *
                  </label>
                  <select
                    value={formData.audienceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, audienceType: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="STUDENTS">Students</option>
                    <option value="TEACHERS">Teachers</option>
                    <option value="MIXED">Mixed (Both)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Branches</option>
                    {filterData.branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                {(formData.audienceType === "STUDENTS" || formData.audienceType === "MIXED") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Year
                    </label>
                    <select
                      value={formData.academicYearId}
                      onChange={(e) => setFormData(prev => ({ ...prev, academicYearId: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Academic Year</option>
                      {filterData.academicYears.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {(formData.audienceType === "STUDENTS" || formData.audienceType === "MIXED") && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={!formData.branchId}
                  >
                    <option value="">Select Class</option>
                    {filteredClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Teacher Selection */}
              {(formData.audienceType === "TEACHERS" || formData.audienceType === "MIXED") && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Teachers
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {filteredTeachers.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        {formData.branchId ? "No teachers found for selected branch" : "Please select a branch first"}
                      </p>
                    ) : (
                      filteredTeachers.map((teacher) => (
                        <label key={teacher.id} className="flex items-center space-x-2 p-1">
                          <input
                            type="checkbox"
                            checked={formData.teacherIds.includes(teacher.id)}
                            onChange={(e) => handleTeacherSelection(teacher.id, e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Student Selection */}
              {(formData.audienceType === "STUDENTS" || formData.audienceType === "MIXED") && formData.classId && (
                <div className="mb-4">
                  <div className="flex items-center space-x-4 mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.assignToEntireClass}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          assignToEntireClass: e.target.checked,
                          studentIds: e.target.checked ? [] : prev.studentIds
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Assign to entire class</span>
                    </label>
                  </div>

                  {!formData.assignToEntireClass && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Students
                      </label>
                      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                        {filteredStudents.length === 0 ? (
                          <p className="text-sm text-gray-500">No students found for selected class</p>
                        ) : (
                          filteredStudents.map((student) => (
                            <label key={student.id} className="flex items-center space-x-2 p-1">
                              <input
                                type="checkbox"
                                checked={formData.studentIds.includes(student.id)}
                                onChange={(e) => handleStudentSelection(student.id, e.target.checked)}
                                className="rounded"
                              />
                              <span className="text-sm">
                                {student.firstName} {student.lastName} ({student.studentId})
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags and Keywords */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Metadata</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Add a tag..."
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={currentKeyword}
                      onChange={(e) => setCurrentKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Add a keyword..."
                    />
                    <button
                      type="button"
                      onClick={addKeyword}
                      className="px-3 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Document will be automatically archived after this date
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.title || !fileData.fileName}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {type === "create" ? "Create Document" : "Update Document"}
              </button>
            </div>
          </form>

          {state.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              Something went wrong. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentForm;
