"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react";
import {
  teacherAssignmentSchema,
  TeacherAssignmentSchema,
} from "@/lib/formValidationSchemas";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { createTeacherAssignment, updateTeacherAssignment, deleteTeacherAssignment } from "@/lib/actions";

const TeacherAssignmentForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update" | "delete";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<TeacherAssignmentSchema>({
    resolver: zodResolver(teacherAssignmentSchema),
  });

  const [state, setState] = useState<{ success: boolean; error: boolean; message?: string }>({ success: false, error: false });
  const [isSubmitting, startTransition] = useTransition();

  const onSubmit = handleSubmit((formData) => {
    console.log("🚀 Form submission:", { formData, assignments, selectedAcademicYearId });
    console.log("🔍 Form validation errors:", errors);

    if (type === "delete") {
      // For delete, create FormData with required fields
      const deleteFormData = new FormData();
      deleteFormData.append("teacherId", data.teacher.id);
      deleteFormData.append("classId", data.class.id.toString());
      deleteFormData.append("subjectId", data.subject.id.toString());
      deleteFormData.append("branchId", data.branch?.id?.toString() || "");
      deleteFormData.append("comment", formData.comment || "");
      deleteFormData.append("currentUserId", "admin"); // TODO: Get actual current user ID
      startTransition(async () => {
        const res = await deleteTeacherAssignment(state, deleteFormData as any);
        setState(res);
        
        if (res.success) {
          toast.success(res.message || "Teacher assignment removed successfully!");
          setOpen(false);
          router.refresh();
        } else {
          toast.error(res.message || "Failed to remove teacher assignment");
        }
      });
    } else {
      // For create/update, validate assignments based on role
      const isSupervisor = formData.assignSupervisor;
      const isTeacher = formData.assignAsTeacher;
      
      if (!isSupervisor && !isTeacher) {
        toast.error("Please select either Supervisor or Subject Teacher role");
        return;
      }
      
      const validAssignments = assignments.filter(a => {
        if (isSupervisor) {
          // Supervisor: branch and class required, subject optional
          return a.branchId && a.classId;
        } else {
          // Teacher: branch, class, and subject all required
          return a.branchId && a.classId && a.subjectId;
        }
      });

      if (validAssignments.length === 0) {
        const missingFields = isSupervisor 
          ? "Please complete assignment with branch and class" 
          : "Please complete at least one assignment with branch, class, and subject";
        toast.error(missingFields);
        return;
      }

      // For now, handle single assignment (first valid one)
      // This can be extended to handle multiple assignments in the future
      const assignment = validAssignments[0];
      const assignmentData = {
        ...formData,
        branchId: assignment.branchId,
        classId: assignment.classId,
        subjectId: assignment.subjectId || null, // Allow null for supervisors
        role: isSupervisor ? "SUPERVISOR" : "TEACHER",
      };

      console.log("📤 Submitting to action:", assignmentData);
      
      startTransition(async () => {
        try {
          console.log("🚀 Starting transition with type:", type);
          
          const res = await (type === "create"
            ? createTeacherAssignment(state, assignmentData as any)
            : updateTeacherAssignment(state, assignmentData as any));
            
          console.log("✅ Action completed with result:", res);
          setState(res);
          
          if (res.success) {
            toast.success(res.message || (type === "create" ? "Assignment created successfully!" : "Assignment updated successfully!"));
            setOpen(false);
            router.refresh();
          } else {
            toast.error(res.message || `Failed to ${type} assignment`);
          }
        } catch (error) {
          console.error("❌ Error in transition:", error);
          toast.error("An unexpected error occurred");
          setState({ success: false, error: true, message: "An unexpected error occurred" });
        }
      });
    }
  });

  const router = useRouter();

  // Prefill form for update
  useEffect(() => {
    if (type === "update" && data) {
      setValue("teacherId", data.teacher?.id || data.teacherId);
      setValue("academicYearId", data.academicYear?.id || data.academicYearId);
      setValue("branchId", data.branch?.id ?? data.branchId);
      setValue("classId", data.class?.id || data.classId);
      setValue("subjectId", data.subject?.id ?? data.subjectId ?? null);
      setValue("assignSupervisor", data.role === "SUPERVISOR");
      setValue("assignAsTeacher", data.role === "TEACHER");
    }
  }, [type, data, setValue]);

  useEffect(() => {
    if (state.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('teacher-assignment-updated'));
      }
      toast.success(`Teacher assignment has been ${type === "create" ? "created" : type === "update" ? "updated" : "deleted"} successfully!`);
      setOpen(false);
      router.refresh();
    } else if (state.error && state.message) {
      toast.error(state.message);
    }
  }, [state, router, type, setOpen]);

  const [teachers, setTeachers] = useState(relatedData?.teachers || []);
  const [classes, setClasses] = useState<{[assignmentId: string]: any[]}>({});
  const [subjects, setSubjects] = useState(relatedData?.subjects || []);
  const [academicYears, setAcademicYears] = useState(relatedData?.academicYears || []);
  const [branches, setBranches] = useState(relatedData?.branches || []);
  const [loading, setLoading] = useState(false);

  // Dynamic assignment management
  const [assignments, setAssignments] = useState([{
    id: 'assignment-0',
    branchId: '',
    classId: '',
    subjectId: ''
  }]);

  const selectedAcademicYearId = watch("academicYearId");

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true);
        // Fetch branches, academic years, and subjects
        const [branchesRes, yearsRes, subjectsRes] = await Promise.all([
          fetch('/api/branches'),
          fetch('/api/academic-years'),
          fetch('/api/subjects')
        ]);

        if (branchesRes.ok) {
          const branchData = await branchesRes.json();
          setBranches(branchData.branches || []);
        }

        if (yearsRes.ok) {
          const years = await yearsRes.json();
          // Support different API response shapes: {academicYears: [...]}, {data: [...]}, or direct array
          setAcademicYears(years.academicYears || years.data || years || []);
        }

        if (subjectsRes.ok) {
          const subs = await subjectsRes.json();
          setSubjects(subs.subjects || []);
        }

        // Pre-populate for update mode
        if (type === "update" && data?.branch) {
          setAssignments([{
            id: 'assignment-0',
            branchId: data.branch.id.toString(),
            classId: data.class?.id?.toString() || '',
            subjectId: data.subject?.id?.toString() || ''
          }]);
        }
      } catch (e) {
        console.error('Failed to load assignment prerequisites', e);
        toast.error('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      if (!selectedAcademicYearId) {
        setTeachers([]);
        return;
      }
      try {
        setLoading(true);
        const teachersRes = await fetch('/api/teachers?status=ACTIVE&limit=500');
        if (teachersRes.ok) {
          const t = await teachersRes.json();
          setTeachers(t.teachers || []);
        }
      } catch (e) {
        console.error('Failed to load teachers', e);
        toast.error('Failed to load teachers');
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, [selectedAcademicYearId]);

  // If a teacher is passed directly, set it
  useEffect(() => {
    if (data?.id && type === 'create') {
      setValue("teacherId", data.id);
    }
  }, [data, type, setValue]);

  // Fetch classes when assignment branch changes
  const fetchClassesForAssignment = async (branchId: string, assignmentId: string) => {
    if (!selectedAcademicYearId || !branchId) return;

    try {
      const classesRes = await fetch(`/api/classes?academicYearId=${selectedAcademicYearId}&branchId=${branchId}`);
      if (classesRes.ok) {
        const c = await classesRes.json();
        setClasses(prev => ({ ...prev, [assignmentId]: c.classes || [] }));
      }
    } catch (e) {
      console.error('Failed to load classes for assignment', e);
    }
  };

  // Assignment management functions
  const addAssignment = () => {
    const newAssignment = {
      id: `assignment-${assignments.length}`,
      branchId: '',
      classId: '',
      subjectId: ''
    };
    setAssignments(prev => [...prev, newAssignment]);
  };

  const removeAssignment = (assignmentId: string) => {
    if (assignments.length > 1) {
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      // Clean up classes for this assignment
      setClasses(prev => {
        const newClasses = { ...prev };
        delete newClasses[assignmentId];
        return newClasses;
      });
    }
  };

  const updateAssignment = (assignmentId: string, field: string, value: string) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === assignmentId
          ? { ...assignment, [field]: value }
          : assignment
      )
    );

    // Fetch classes when branch changes
    if (field === 'branchId' && value) {
      fetchClassesForAssignment(value, assignmentId);
    }
  };

  const selectedTeacher = watch("teacherId");

  // Get current assignment details for better UX
  const currentAssignment = data ? {
    teacherName: data.teacher?.firstName && data.teacher?.lastName 
      ? `${data.teacher.firstName} ${data.teacher.lastName}` 
      : data.teacher?.name || 'Unknown Teacher',
    className: data.class?.name || 'Unknown Class',
    subjectName: data.subject?.name || 'Unknown Subject',
    academicYearName: data.academicYear?.name || 'Unknown Year'
  } : null;

  return (
    <form className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto" onSubmit={onSubmit}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {type === "create" ? "Create Teacher Assignment" : 
           type === "update" ? "Update Teacher Assignment" : 
           "Delete Teacher Assignment"}
        </h1>
        {type === "update" && currentAssignment && (
          <div className="text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
            Current: {currentAssignment.teacherName} → {currentAssignment.subjectName} in {currentAssignment.className}
          </div>
        )}
      </div>
      
      {/* Information Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-700 font-medium mb-1">📋 Assignment Rules</p>
        <ul className="text-xs text-amber-600 list-disc list-inside space-y-1">
          <li>Normal teachers can be assigned to multiple classes and subjects</li>
          <li>Supervisors can teach subjects in their supervised class and other classes</li>
          <li>One teacher-class-subject combination per academic year</li>
          <li>One teacher can only supervise one class per academic year</li>
        </ul>
      </div>

      {/* Basic Assignment Setup with Supervisor/Teacher toggles */}
      <span className="text-xs text-gray-400 font-medium">
        Basic Assignment Setup
      </span>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">
            Academic Year <span className="text-red-500">*</span>
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
            {...register("academicYearId")}
            defaultValue={data?.academicYear?.id || data?.academicYearId}
            disabled={loading || isSubmitting}
          >
            <option value="">Select Academic Year</option>
            {academicYears.map((year: any) => (
              <option key={year.id} value={year.id}>
                {year.name} {year.isCurrent ? "(Current)" : ""}
              </option>
            ))}
          </select>
          {errors?.academicYearId?.message && (
            <p className="text-xs text-red-400">
              {errors.academicYearId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">
            Teacher
          </label>
          <div className="ring-[1.5px] ring-gray-200 bg-gray-50 p-2 rounded-md text-sm w-full text-gray-900">
            {type === 'create' ? `${data?.firstName || ''} ${data?.lastName || ''}` : `${data?.teacher?.firstName || ''} ${data?.teacher?.lastName || ''}`}
          </div>
        </div>
      </div>

      {/* Role Selection - Mutually Exclusive */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Assignment Role</h3>
        <div className="flex flex-col gap-3">
          {/* Supervisor Toggle */}
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              className="sr-only peer"
              {...register('assignSupervisor')}
              onChange={(e) => {
                if (e.target.checked) {
                  setValue('assignAsTeacher', false);
                }
              }}
            />
            <div
              className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-green-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-full"
            ></div>
            <span className="ml-3 text-sm font-medium text-gray-700 peer-checked:text-gray-900">
              Class Supervisor
            </span>
            <span className="ml-2 text-xs text-gray-500">(Can supervise one class per academic year + optionally teach subjects)</span>
          </label>

          {/* Teacher Toggle */}
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              defaultChecked
              className="sr-only peer"
              {...register('assignAsTeacher')}
              onChange={(e) => {
                if (e.target.checked) {
                  setValue('assignSupervisor', false);
                }
              }}
            />
            <div
              className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-green-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-full"
            ></div>
            <span className="ml-3 text-sm font-medium text-gray-700 peer-checked:text-gray-900">
              Subject Teacher
            </span>
            <span className="ml-2 text-xs text-gray-500">(Can teach multiple subjects across classes)</span>
          </label>
        </div>
      </div>

      {/* Dynamic Assignments */}
      <span className="text-xs text-gray-400 font-medium">
        Teaching Assignments
      </span>

      {assignments.map((assignment, index) => (
        <div key={assignment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              Assignment #{index + 1}
            </h4>
            {assignments.length > 1 && (
              <button
                type="button"
                onClick={() => removeAssignment(assignment.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">
                Branch <span className="text-red-500">*</span>
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
                value={assignment.branchId}
                onChange={(e) => updateAssignment(assignment.id, 'branchId', e.target.value)}
                disabled={!selectedAcademicYearId || loading || isSubmitting}
              >
                <option value="">Select Branch</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.shortName} - {branch.district}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
                value={assignment.classId}
                onChange={(e) => updateAssignment(assignment.id, 'classId', e.target.value)}
                disabled={!assignment.branchId || loading || isSubmitting}
              >
                <option value="">Select Class</option>
                {loading ? (
                  <option disabled>Loading classes...</option>
                ) : (
                  (classes[assignment.id] || []).map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">
                Subject <span className={watch('assignSupervisor') ? "text-gray-400" : "text-red-500"}>
                  {watch('assignSupervisor') ? "(optional)" : "*"}
                </span>
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
                value={assignment.subjectId}
                onChange={(e) => updateAssignment(assignment.id, 'subjectId', e.target.value)}
                disabled={loading || isSubmitting}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}

      {/* Add Assignment Button - Only for Subject Teachers */}
      {watch('assignAsTeacher') && !watch('assignSupervisor') && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={addAssignment}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm"
            disabled={!selectedAcademicYearId || isSubmitting}
          >
            + Add Another Subject Assignment
          </button>
        </div>
      )}
      
      {/* Info for Supervisors */}
      {watch('assignSupervisor') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium mb-1">ℹ️ Supervisor Assignment</p>
          <p className="text-xs text-blue-600">
            As a supervisor, this teacher can manage one class per academic year and optionally teach subjects in that class or others.
            Only one supervisor assignment is allowed per academic year.
          </p>
        </div>
      )}

      {/* Hidden field for update */}
      {type === "update" && (
        <input type="hidden" {...register("id")} value={data?.id} />
      )}

      {/* Delete confirmation for delete type */}
      {type === "delete" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Delete Teacher Assignment</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>This will remove the assignment of <strong>{data?.teacher?.firstName || data?.teacher?.name?.split(' ')[0]} {data?.teacher?.lastName || data?.teacher?.name?.split(' ')[1]}</strong> to teach <strong>{data?.subject?.name}</strong> in <strong>{data?.class?.name}</strong>.</p>
                <p className="mt-1">This action cannot be undone.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment field for delete type */}
      {type === "delete" && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Comment <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register("comment")}
            rows={4}
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400 resize-none"
            placeholder="Please provide a reason for deleting this assignment (minimum 10 characters)..."
          />
          {errors?.comment?.message && (
            <p className="text-xs text-red-400">{errors.comment.message.toString()}</p>
          )}
          <p className="text-xs text-gray-500">
            Minimum 10 characters required. This comment will be recorded for audit purposes.
          </p>
        </div>
      )}

      {state.error && state.message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{state.message}</p>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="bg-gray-400 text-white p-2 rounded-md hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className={`p-2 rounded-md text-white transition-colors ${
            type === "delete" 
              ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400" 
              : "bg-blue-400 hover:bg-blue-500 disabled:bg-blue-300"
          }`}
        >
          {loading || isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {type === "create" ? "Creating..." : 
               type === "update" ? "Updating..." : 
               "Deleting..."}
            </div>
          ) : (
            type === "create" ? "Create Assignment" : 
            type === "update" ? "Update Assignment" : 
            "Delete Assignment"
          )}
        </button>
      </div>
    </form>
  );
};

export default TeacherAssignmentForm;
