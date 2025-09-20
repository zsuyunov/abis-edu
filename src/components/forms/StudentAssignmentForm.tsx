"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react";
import {
  studentAssignmentSchema,
  StudentAssignmentSchema,
} from "@/lib/formValidationSchemas";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { createStudentAssignment, updateStudentAssignment, deleteStudentAssignment } from "@/lib/studentAssignmentActions";

const StudentAssignmentForm = ({
  type,
  data,
  setOpen,
  relatedData
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
  } = useForm<StudentAssignmentSchema>({
    resolver: zodResolver(studentAssignmentSchema),
  });

  const [state, setState] = useState<{ success: boolean; error: boolean; message?: string }>({ success: false, error: false });
  const [isSubmitting, startTransition] = useTransition();
  
  // State for dynamic data
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Watch for changes
  const selectedAcademicYearId = watch("academicYearId");
  const selectedBranchId = watch("branchId");

  const onSubmit = handleSubmit((formData) => {
    console.log("🚀 Student Assignment submission:", { formData });
    console.log("🔍 Form validation errors:", errors);

    if (type === "delete") {
      // For delete, create FormData with required fields
      const deleteFormData = new FormData();
      deleteFormData.append("studentId", data?.studentId || "");
      deleteFormData.append("academicYearId", data?.academicYearId?.toString() || "");
      deleteFormData.append("comment", formData.comment || "");

      startTransition(async () => {
        const res = await deleteStudentAssignment(state, deleteFormData);
        setState(res);
        
        if (res.success) {
          toast.success(res.message || "Student assignment removed successfully!");
          setOpen(false);
          router.refresh();
        } else {
          toast.error(res.message || "Failed to remove student assignment");
        }
      });
    } else {
      // For create/update, validate required fields
      if (!formData.studentId || !formData.academicYearId || !formData.branchId || !formData.classId) {
        toast.error("Please fill in all required fields");
        return;
      }

      const assignmentData = {
        ...formData,
        status: "ACTIVE",
        enrolledAt: new Date(),
      };

      console.log("📤 Submitting to action:", assignmentData);
      
      startTransition(async () => {
        try {
          console.log("🚀 Starting transition with type:", type);
          
          const res = await (type === "create"
            ? createStudentAssignment(state, assignmentData as any)
            : updateStudentAssignment(state, assignmentData as any));
            
          console.log("✅ Action completed with result:", res);
          setState(res);
          
          if (res.success) {
            toast.success(type === "create" ? "Student assignment created successfully!" : "Student assignment updated successfully!");
            setOpen(false);
            router.refresh();
          } else {
            toast.error(res.message || `Failed to ${type} student assignment`);
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

  useEffect(() => {
    if (state.success) {
      toast.success("Student assignment operation completed successfully!");
      setOpen(false);
      router.refresh();
    } else if (state.error && state.message) {
      toast.error(state.message);
    }
  }, [state, setOpen, router]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true);
        const [branchesRes, yearsRes, studentsRes] = await Promise.all([
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
          fetch('/api/students?status=ACTIVE', {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          })
        ]);

        const branchesData = await branchesRes.json();
        const yearsData = await yearsRes.json();
        const studentsData = await studentsRes.json();

        setBranches(branchesData.branches || branchesData.data || branchesData || []);
        setAcademicYears(yearsData.academicYears || yearsData.data || yearsData || []);
        setStudents(studentsData.students || studentsData.data || studentsData || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
  }, []);

  // Fetch classes when branch changes
  useEffect(() => {
    if (selectedBranchId && selectedAcademicYearId) {
      const fetchClasses = async () => {
        try {
          const response = await fetch(`/api/classes?branchId=${selectedBranchId}&academicYearId=${selectedAcademicYearId}`);
          const data = await response.json();
          setClasses(data?.classes || data?.data || data || []);
        } catch (error) {
          console.error('Error fetching classes:', error);
          setClasses([]);
        }
      };

      fetchClasses();
    } else {
      setClasses([]);
    }
  }, [selectedBranchId, selectedAcademicYearId]);

  // Fetch unassigned students for the selected academic year
  useEffect(() => {
    if (selectedAcademicYearId) {
      const fetchUnassignedStudents = async () => {
        try {
          const response = await fetch(`/api/unassigned-students?academicYearId=${selectedAcademicYearId}`);
          const data = await response.json();
          setUnassignedStudents(data?.students || data?.data || data || []);
        } catch (error) {
          console.error('Error fetching unassigned students:', error);
          setUnassignedStudents([]);
        }
      };

      fetchUnassignedStudents();
    } else {
      setUnassignedStudents([]);
    }
  }, [selectedAcademicYearId]);

  // Prefill form for update/delete
  useEffect(() => {
    if (type === "update" && data) {
      setValue("studentId", data?.studentId || "");
      setValue("academicYearId", data?.academicYearId || "");
      setValue("branchId", data?.branchId || "");
      setValue("classId", data?.classId || "");
    }
  }, [type, data, setValue]);

  // If a student is passed directly, set it
  useEffect(() => {
    if (data?.id && type === 'create') {
      setValue("studentId", data?.id || "");
    }
  }, [data, type, setValue]);

  return (
    <form className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto" onSubmit={onSubmit}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {type === "create" && "Create Student Assignment"}
          {type === "update" && "Update Student Assignment"}
          {type === "delete" && "Delete Student Assignment"}
        </h1>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-500">
            {loading ? "Loading..." : "Ready"}
          </span>
        </div>
      </div>

      {/* Hidden studentId to ensure it is submitted */}
      <input type="hidden" {...register("studentId")} />

      {type === "delete" ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Confirm Deletion
          </h3>
          <p className="text-sm text-red-700 mb-4">
            Are you sure you want to delete the assignment for student{" "}
            <strong>{data?.student?.firstName} {data?.student?.lastName}</strong>{" "}
            from {data?.class?.name} in {data?.branch?.shortName}?
          </p>
          <p className="text-xs text-red-600">
            This action cannot be undone. The student will be unassigned from this class.
          </p>
        </div>
      ) : (
        <>
          {/* Academic Year Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
                {...register("academicYearId")}
                defaultValue={data?.academicYearId}
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
                <p className="text-xs text-red-400">{errors.academicYearId.message.toString()}</p>
              )}
            </div>

            {/* Student Information */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Student</label>
              <div className="ring-[1.5px] ring-gray-200 bg-gray-50 p-2 rounded-md text-sm w-full text-gray-900">
                {type === 'create' 
                  ? data ? `${data.firstName} ${data.lastName} (${data.studentId})` : 'No student data'
                  : data?.student ? `${data.student.firstName} ${data.student.lastName} (${data.student.studentId})` : 'No student data'
                }
              </div>
            </div>
          </div>

          {/* Branch and Class Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">
                Branch <span className="text-red-500">*</span>
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
                {...register("branchId")}
                defaultValue={data?.branchId}
                disabled={!selectedAcademicYearId || loading || isSubmitting}
              >
                <option value="">Select Branch</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.shortName} - {branch.district}
                  </option>
                ))}
              </select>
              {errors?.branchId?.message && (
                <p className="text-xs text-red-400">{errors.branchId.message.toString()}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
                {...register("classId")}
                defaultValue={data?.classId}
                disabled={!selectedBranchId || loading || isSubmitting}
              >
                <option value="">Select Class</option>
                {loading ? (
                  <option disabled>Loading classes...</option>
                ) : (
                  classes.length > 0 ? (
                    classes.map((classItem: any) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name} ({classItem.language}) - {classItem.capacity} students
                      </option>
                    ))
                  ) : (
                    <option disabled>
                      {selectedBranchId ? "No classes available" : "Select branch first"}
                    </option>
                  )
                )}
              </select>
              {errors?.classId?.message && (
                <p className="text-xs text-red-400">{errors.classId.message.toString()}</p>
              )}
            </div>
          </div>

          {/* Assignment Statistics */}
          {selectedBranchId && selectedAcademicYearId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Assignment Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-blue-600 font-medium">Unassigned Students</div>
                  <div className="text-lg font-bold text-blue-800">{unassignedStudents.length}</div>
                </div>
                <div>
                  <div className="text-green-600 font-medium">Available Classes</div>
                  <div className="text-lg font-bold text-green-800">{classes.length}</div>
                </div>
                <div>
                  <div className="text-purple-600 font-medium">Selected Branch</div>
                  <div className="text-sm font-medium text-purple-800">
                    {branches.find(b => b.id == selectedBranchId)?.shortName || "None"}
                  </div>
                </div>
                <div>
                  <div className="text-orange-600 font-medium">Academic Year</div>
                  <div className="text-sm font-medium text-orange-800">
                    {academicYears.find(y => y.id == selectedAcademicYearId)?.name || "None"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Comment Field */}
      {type === "delete" && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">
            Reason for Deletion <span className="text-red-500">*</span>
          </label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
            {...register("comment")}
            placeholder="Please provide a reason for deleting this assignment..."
            rows={3}
            disabled={isSubmitting}
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

export default StudentAssignmentForm;
