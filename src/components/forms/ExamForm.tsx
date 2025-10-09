"use client";

import { useState, useEffect } from "react";
import { csrfFetch } from '@/hooks/useCsrfToken';
import Image from "next/image";
import TimeSelector from "@/components/ui/TimeSelector";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [filterData, setFilterData] = useState<FilterData>({
    branches: [],
    academicYears: [],
    classes: [],
    subjects: [],
    teachers: [],
  });

  // Helper function to convert HH:MM:SS to HH:MM AM/PM format
  const convertTimeToDisplayFormat = (timeString: string) => {
    if (!timeString) return "";
    
    // If already in AM/PM format, return as is
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }
    
    // Parse HH:MM:SS format
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) return "";
    
    let hour12 = hours;
    let period = 'AM';
    
    if (hours === 0) {
      hour12 = 12;
    } else if (hours === 12) {
      period = 'PM';
    } else if (hours > 12) {
      hour12 = hours - 12;
      period = 'PM';
    }
    
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Form state
  const [formData, setFormData] = useState({
    name: data?.name || "",
    date: data?.date ? new Date(data.date).toISOString().split('T')[0] : "",
    examDay: data?.examDay || "",
    startTime: convertTimeToDisplayFormat(data?.startTime || ""),
    endTime: convertTimeToDisplayFormat(data?.endTime || ""),
    roomNumber: data?.roomNumber || "",
    fullMarks: data?.fullMarks || "",
    passingMarks: data?.passingMarks || "",
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


  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesRes, academicYearsRes, subjectsRes] = await Promise.all([
          fetch('/api/branches', {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          }),
          fetch('/api/academic-years', {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          }),
          fetch('/api/subjects', {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          })
        ]);

        const [branchesData, academicYearsData, subjectsData] = await Promise.all([
          branchesRes.json(),
          academicYearsRes.json(),
          subjectsRes.json()
        ]);

        setFilterData({
          branches: Array.isArray(branchesData) ? branchesData : (branchesData.branches || []),
          academicYears: Array.isArray(academicYearsData) ? academicYearsData : (academicYearsData.academicYears || []),
          classes: [],
          subjects: Array.isArray(subjectsData) ? subjectsData : (subjectsData.subjects || []),
          teachers: [], // Will be fetched when subject is selected
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
          const response = await csrfFetch(`/api/classes?branchId=${formData.branchId}&academicYearId=${formData.academicYearId}`);
          const data = await response.json();
          setFilterData(prev => ({ ...prev, classes: Array.isArray(data) ? data : (data.classes || []) }));
        } catch (error) {
          console.error('Failed to fetch classes:', error);
        }
      };
      fetchClasses();
    }
  }, [formData.branchId, formData.academicYearId]);

  // Fetch classes on mount if editing with existing data
  useEffect(() => {
    if (type === "update" && data?.branchId && data?.academicYearId) {
      const fetchClasses = async () => {
        try {
          const response = await csrfFetch(`/api/classes?branchId=${data.branchId}&academicYearId=${data.academicYearId}`);
          const classesData = await response.json();
          setFilterData(prev => ({ ...prev, classes: Array.isArray(classesData) ? classesData : (classesData.classes || []) }));
        } catch (error) {
          console.error('Failed to fetch classes for edit:', error);
        }
      };
      fetchClasses();
    }
  }, [type, data?.branchId, data?.academicYearId]);

  // Fetch teachers when subject is selected
  useEffect(() => {
    const fetchTeachers = async () => {
      // Fetch teachers if we have at least subject and branch, class is optional
      if (formData.subjectId && formData.branchId) {
        try {
          const params = new URLSearchParams({
            subjectId: formData.subjectId,
            branchId: formData.branchId
          });
          
          // Add class if available
          if (formData.classId) {
            params.append('classId', formData.classId);
          }
          
          console.log('Fetching teachers with params:', { subjectId: formData.subjectId, branchId: formData.branchId, classId: formData.classId });
          
          const response = await csrfFetch(`/api/teachers/with-subjects?${params}`);
          const teachersData = await response.json();
          
          console.log('Teachers API response:', teachersData);
          
          setFilteredTeachers(Array.isArray(teachersData) ? teachersData : []);
        } catch (error) {
          console.error('Failed to fetch teachers:', error);
          setFilteredTeachers([]);
        }
      } else {
        setFilteredTeachers([]);
      }
    };

    fetchTeachers();
  }, [formData.subjectId, formData.branchId, formData.classId]);

  // Fetch teachers on mount if editing with existing data
  useEffect(() => {
    if (type === "update" && data?.subjectId && data?.branchId) {
      const fetchTeachers = async () => {
        try {
          const params = new URLSearchParams({
            subjectId: data.subjectId,
            branchId: data.branchId
          });
          
          // Add class if available
          if (data.classId) {
            params.append('classId', data.classId);
          }

          const response = await csrfFetch(`/api/teachers/with-subjects?${params}`);
          const teachersData = await response.json();
          
          console.log('Fetched teachers for edit:', teachersData);
          
          setFilteredTeachers(Array.isArray(teachersData) ? teachersData : []);
        } catch (error) {
          console.error('Failed to fetch teachers for edit:', error);
          setFilteredTeachers([]);
        }
      };
      fetchTeachers();
    }
  }, [type, data?.subjectId, data?.branchId, data?.classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Helper function to convert time string to Time format
      const convertTimeToTimeFormat = (timeString: string) => {
        // Parse time string like "8:00 AM" or "10:00 AM"
        const [time, period] = timeString.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24-hour format
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) {
          hour24 = hours + 12;
        } else if (period === 'AM' && hours === 12) {
          hour24 = 0;
        }
        
        // Format as HH:MM:SS for database Time field
        return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      };

      // Prepare the data for submission
      const submitData: any = {
        ...formData,
        // Convert string values to appropriate types
        branchId: parseInt(formData.branchId),
        academicYearId: parseInt(formData.academicYearId),
        classId: parseInt(formData.classId),
        subjectId: formData.subjectId ? parseInt(formData.subjectId) : undefined,
        fullMarks: formData.fullMarks ? parseInt(formData.fullMarks) : undefined,
        passingMarks: formData.passingMarks ? parseInt(formData.passingMarks) : undefined,
        // Convert date to proper format
        date: new Date(formData.date).toISOString(),
        // Convert time strings to Time format
        startTime: convertTimeToTimeFormat(formData.startTime),
        endTime: convertTimeToTimeFormat(formData.endTime),
      };

      if (type === "update" && data?.id) {
        submitData.id = data.id;
      }

      console.log('Submitting exam data:', submitData);

      const response = await csrfFetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {
      onSuccess();
      onClose();
      } else {
        setSubmitError(result.error || 'Failed to create exam');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('An error occurred while submitting the form');
    } finally {
      setIsSubmitting(false);
    }
  };


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

          <form onSubmit={handleSubmit} className="space-y-6">
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
                <TimeSelector
                  value={formData.startTime}
                  onChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}
                  placeholder="Select Start Time"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time <span className="text-red-500">*</span>
                </label>
                <TimeSelector
                  value={formData.endTime}
                  onChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}
                  placeholder="Select End Time"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number/Name
                </label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Room 101 or Conference Hall"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Marks
                </label>
                <input
                  type="number"
                  value={formData.fullMarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullMarks: e.target.value ? parseInt(e.target.value) : "" }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="100"
                  min="1"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Marks
                </label>
                <input
                  type="number"
                  value={formData.passingMarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, passingMarks: e.target.value ? parseInt(e.target.value) : "" }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="40"
                  min="0"
                  max={formData.fullMarks || 1000}
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
                  disabled={!formData.subjectId || !formData.branchId}
                >
                  <option value="">
                    {!formData.subjectId || !formData.branchId 
                      ? "Select Subject & Branch first" 
                      : filteredTeachers.length === 0 
                        ? "No teachers available for this subject" 
                        : "Select Teacher (Optional)"
                    }
                  </option>
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
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : (type === "create" ? "Create Exam" : "Update Exam")}
              </button>
            </div>
          </form>

          {submitError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {submitError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamForm;