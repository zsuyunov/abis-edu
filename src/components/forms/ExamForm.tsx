"use client";

import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { createExam, updateExam } from "@/lib/actions";
import Image from "next/image";

interface ExamFormProps {
  type: "create" | "update";
  data?: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface FilterData {
  branches: { id: number; shortName: string; district: string }[];
  academicYears: { id: number; name: string }[];
  classes: { id: number; name: string; branchId: number; academicYearId: number }[];
  subjects: { id: number; name: string }[];
  teachers: { id: string; firstName: string; lastName: string; teacherId: string; branchId: number; subjects: { id: number }[] }[];
}

const ExamForm = ({ type, data, onClose, onSuccess }: ExamFormProps) => {
  const [state, formAction] = useFormState(
    type === "create" ? createExam : updateExam,
    {
      success: false,
      error: false,
    }
  );

  const [filterData, setFilterData] = useState<FilterData>({
    branches: [],
    academicYears: [],
    classes: [],
    subjects: [],
    teachers: [],
  });

  // Form state
  const [formData, setFormData] = useState({
    name: data?.name || "",
    date: data?.date ? new Date(data.date).toISOString().split('T')[0] : "",
    examDay: data?.examDay || "",
    startTime: data?.startTime || "",
    endTime: data?.endTime || "",
    roomNumber: data?.roomNumber || "",
    fullMarks: data?.fullMarks || 100,
    passingMarks: data?.passingMarks || 40,
    status: data?.status || "SCHEDULED",
    branchId: data?.branchId || "",
    academicYearId: data?.academicYearId || "",
    classId: data?.classId || "",
    subjectId: data?.subjectId || "",
    teacherId: data?.teacherId || "",
  });

  // Filtered teachers based on selected subject
  const [filteredTeachers, setFilteredTeachers] = useState<FilterData['teachers']>([]);

  // Day options
  const dayOptions = [
    { value: "Monday", label: "Monday" },
    { value: "Tuesday", label: "Tuesday" },
    { value: "Wednesday", label: "Wednesday" },
    { value: "Thursday", label: "Thursday" },
    { value: "Friday", label: "Friday" },
    { value: "Saturday", label: "Saturday" },
    { value: "Sunday", label: "Sunday" },
  ];

  // Time options
  const timeSlots = [];
  for (let hour = 7; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
      timeSlots.push({ value: time12, label: time12 });
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesRes, academicYearsRes, subjectsRes, teachersRes] = await Promise.all([
          fetch('/api/branches'),
          fetch('/api/academic-years'),
          fetch('/api/subjects'),
          fetch('/api/teachers')
        ]);

        const [branchesData, academicYearsData, subjectsData, teachersData] = await Promise.all([
          branchesRes.json(),
          academicYearsRes.json(),
          subjectsRes.json(),
          teachersRes.json()
        ]);

        setFilterData({
          branches: branchesData.branches || [],
          academicYears: academicYearsData.academicYears || [],
          classes: [],
          subjects: subjectsData.subjects || [],
          teachers: teachersData.teachers || [],
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // Fetch classes when branch and academic year are selected
  useEffect(() => {
    if (formData.branchId && formData.academicYearId) {
      const fetchClasses = async () => {
        try {
          const response = await fetch(`/api/classes?branchId=${formData.branchId}&academicYearId=${formData.academicYearId}`);
          const data = await response.json();
          setFilterData(prev => ({ ...prev, classes: data.classes || [] }));
        } catch (error) {
          console.error('Failed to fetch classes:', error);
        }
      };
      fetchClasses();
    }
  }, [formData.branchId, formData.academicYearId]);

  // Filter teachers based on selected subject
  useEffect(() => {
    if (formData.subjectId) {
      const teachersForSubject = filterData.teachers.filter(teacher => 
        teacher.subjects.some(subject => subject.id === parseInt(formData.subjectId))
      );
      setFilteredTeachers(teachersForSubject);
    } else {
      setFilteredTeachers(filterData.teachers);
    }
  }, [formData.subjectId, filterData.teachers]);

  const handleSubmit = (formDataObj: FormData) => {
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== "") {
        formDataObj.append(key, value.toString());
      }
    });

    if (type === "update" && data?.id) {
      formDataObj.append("id", data.id.toString());
    }

    formAction(formDataObj as any);
  };

  // Handle form submission
  useEffect(() => {
    if (state.success) {
      onSuccess();
      onClose();
    }
  }, [state, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {type === "create" ? "Create Exam" : "Update Exam"}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <Image src="/close.png" alt="close" width={16} height={16} />
            </button>
          </div>

          <form action={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Mid-Term Mathematics Exam"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Day <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.examDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, examDay: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Day</option>
                  {dayOptions.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Start Time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select End Time</option>
                  {timeSlots
                    .filter(slot => !formData.startTime || slot.value > formData.startTime)
                    .map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number/Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Room 101 or Conference Hall"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.fullMarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullMarks: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="1"
                  max="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.passingMarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, passingMarks: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  max={formData.fullMarks}
                  required
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value, academicYearId: "", classId: "" }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Branch</option>
                  {filterData.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.shortName} - {branch.district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.academicYearId}
                  onChange={(e) => setFormData(prev => ({ ...prev, academicYearId: e.target.value, classId: "" }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={!formData.branchId}
                  required
                >
                  <option value="">Select Academic Year</option>
                  {filterData.academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={!formData.academicYearId}
                  required
                >
                  <option value="">Select Class</option>
                  {filterData.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value, teacherId: "" }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Subject (Optional)</option>
                  {filterData.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={!formData.subjectId}
                >
                  <option value="">Select Teacher (Optional)</option>
                  {filteredTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
                    </option>
                  ))}
                </select>
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
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {type === "create" ? "Create Exam" : "Update Exam"}
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

export default ExamForm;