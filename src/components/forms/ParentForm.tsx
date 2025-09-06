"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import InputField from "../InputField";
import PasswordField from "../PasswordField";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import {
  parentSchema,
  parentUpdateSchema,
  ParentSchema,
  ParentUpdateSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import {
  createParent,
  updateParent,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const ParentForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const isCreatingFromStudent = type === "create" && data?.studentId;
  const isEditing = type === "update";

  const methods = useForm<ParentSchema | ParentUpdateSchema>({
    resolver: zodResolver(type === "update" ? parentUpdateSchema : parentSchema),
    defaultValues: type === "update" ? {
      id: data?.id,
      firstName: data?.firstName,
      lastName: data?.lastName,
      phone: data?.phone,
      parentId: data?.parentId,
      password: "",
      status: data?.status || "ACTIVE",
      branchId: data?.branchId,
      studentIds: data?.studentIds || [],
    } : {
      status: "ACTIVE",
      studentIds: isCreatingFromStudent ? [data.studentId] : [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  // Enhanced: dynamic data for branch -> class -> students
  const { branches: initialBranches } = (relatedData as any) || {};
  const [branches, setBranches] = useState<any[]>(initialBranches || []);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(String(data?.branchId || ""));
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    isCreatingFromStudent ? [data.studentId] : (Array.isArray(data?.studentIds) ? data.studentIds : [])
  );
  const [parentIdError, setParentIdError] = useState<string>("");
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [studentForNewParent, setStudentForNewParent] = useState<any>(null);

  useEffect(() => {
    if (isCreatingFromStudent) {
      const fetchStudentData = async () => {
        try {
          const res = await fetch(`/api/students/${data.studentId}`);
          if (res.ok) {
            const studentData = await res.json();
            setStudentForNewParent(studentData);
            setSelectedBranchId(String(studentData.branchId));
            methods.setValue("branchId", studentData.branchId, { shouldValidate: true, shouldDirty: true });
          }
        } catch (error) {
          console.error("Failed to fetch student data", error);
        }
      };
      fetchStudentData();
    }
  }, [isCreatingFromStudent, data?.studentId, methods]);


  // Fetch branches when form opens
  useEffect(() => {
    if (isCreatingFromStudent || isEditing) return; // Don't fetch branches if creating from student context or editing
    const fetchBranches = async () => {
      try {
        const res = await fetch('/api/branches');
        if (res.ok) {
          const json = await res.json();
          setBranches(json.branches || []);
        }
      } catch (e) {
        setBranches(initialBranches || []);
      }
    };
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreatingFromStudent, isEditing]);

  // Load ACTIVE classes for selected branch
  useEffect(() => {
    if (isCreatingFromStudent || isEditing) return;
    const loadClasses = async () => {
      if (!selectedBranchId) {
        setClasses([]);
        setSelectedClassId("");
        return;
      }
      try {
        const res = await fetch(`/api/classes?branchId=${selectedBranchId}`);
        if (res.ok) {
          const json = await res.json();
          setClasses(json.classes || []);
        }
      } catch (e) {
        setClasses([]);
      }
    };
    loadClasses();
    // Reset selected students when branch changes
    setSelectedStudentIds([]);
  }, [selectedBranchId, isCreatingFromStudent]);

  // Load ACTIVE students for selected branch/class
  useEffect(() => {
    if (isCreatingFromStudent || isEditing) return;
    const loadStudents = async () => {
      if (!selectedBranchId) {
        setStudents([]);
        return;
      }
      const params = new URLSearchParams({ branchId: selectedBranchId, status: 'ACTIVE', limit: '500', page: '1' });
      if (selectedClassId) params.append('classId', selectedClassId);
      try {
        const res = await fetch(`/api/students/optimized?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json.students)
            ? json.students
            : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json?.result)
            ? json.result
            : Array.isArray(json?.data?.students)
            ? json.data.students
            : [];
          setStudents(list);
        }
      } catch (e) {
        setStudents([]);
      }
    };
    loadStudents();
  }, [selectedBranchId, selectedClassId, isCreatingFromStudent]);

  const toggleStudent = (id: string) => {
    if (isCreatingFromStudent) return; // Don't allow changing student
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  // Keep RHF values in sync with local UI state so Zod validation passes
  useEffect(() => {
    // branchId is a number in schema
    if (selectedBranchId) {
      methods.setValue("branchId", Number(selectedBranchId), { shouldValidate: false, shouldDirty: true });
    } else {
      methods.setValue("branchId", undefined as unknown as number, { shouldValidate: false, shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId]);

  useEffect(() => {
    methods.setValue("studentIds", selectedStudentIds, { shouldValidate: false, shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentIds]);

  // Parent ID validation function
  const validateParentId = async (parentId: string) => {
    if (!parentId) {
      setParentIdError("");
      return;
    }

    // Check format
    if (!parentId.match(/^P\d{5}$/)) {
      if (parentId.match(/^p\d{5}$/)) {
        setParentIdError("Parent ID must start with capital 'P'. Please use P instead of p.");
      } else if (parentId.match(/^\d{5}$/)) {
        setParentIdError("Parent ID must start with 'P'. Please add P before the numbers.");
      } else {
        setParentIdError("Parent ID must be in format P##### (e.g., P12345)");
      }
      return;
    }

    // For updates, allow keeping the same ID
    if (type === "update" && parentId === data?.parentId) {
      setParentIdError("");
      return;
    }

    // Check if ID already exists
    setIsCheckingId(true);
    try {
      const response = await fetch(`/api/check-parent-id?parentId=${parentId}`);
      const responseData = await response.json();
      
      if (responseData.exists) {
        setParentIdError("This Parent ID is already taken. Please use a different ID.");
      } else {
        setParentIdError("");
      }
    } catch (error) {
      console.error("Error checking parent ID:", error);
      setParentIdError("Error checking Parent ID availability. Please try again.");
    } finally {
      setIsCheckingId(false);
    }
  };

  // Debounced parent ID validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const parentId = methods.watch("parentId");
      if (parentId) {
        validateParentId(parentId);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [methods.watch("parentId"), type, data?.parentId]);

  const action = type === 'create' ? createParent : updateParent;
  const [state, formAction] = useFormState(action, {
    success: false,
    error: false,
    message: '',
  });

  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    console.log("🚀 Parent form submitted:", formData);
    console.log("🚀 Is creating from student:", isCreatingFromStudent);
    console.log("🚀 Student data:", studentForNewParent);
    
    const payload = new FormData();
    Object.keys(formData).forEach(key => {
        const value = (formData as any)[key];
        if (Array.isArray(value)) {
            value.forEach(item => payload.append(`${key}[]`, item));
        } else if (value !== undefined && value !== null) {
            payload.append(key, value);
        }
    });

    if (isCreatingFromStudent) {
      payload.set('studentIds[]', data.studentId);
      // Add branchId from student data
      if (studentForNewParent?.branchId) {
        payload.set('branchId', String(studentForNewParent.branchId));
      }
    } else if (!isEditing) {
      // For regular creation (not editing), add selected students and branch
      selectedStudentIds.forEach(id => payload.append('studentIds[]', id));
      if (selectedBranchId) {
        payload.set('branchId', selectedBranchId);
      }
    }
    // For editing, don't add studentIds or branchId - they should remain unchanged

    console.log("🚀 Final payload:", Array.from(payload.entries()));
    formAction(payload);
  });

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || `Parent has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error && state.message) {
      toast.error(state.message);
    }
  }, [state, router, type, setOpen]);

  return (
    <FormProvider {...methods}>
      <form className="flex flex-col gap-8" onSubmit={onSubmit}>
                    <h1 className="text-xl font-semibold">
              {type === "create" 
                ? `Create a new parent${studentForNewParent ? ` for ${studentForNewParent.firstName} ${studentForNewParent.lastName}` : ''}` 
                : "Update the parent"
              }
            </h1>
        
        {/* Basic Information */}
        <span className="text-xs text-gray-400 font-medium">
          Basic Information
        </span>
        <div className="flex justify-between flex-wrap gap-4">
          <InputField
            label="First Name"
            name="firstName"
            defaultValue={data?.firstName}
            register={register}
            error={errors?.firstName}
            required
          />
          <InputField
            label="Last Name"
            name="lastName"
            defaultValue={data?.lastName}
            register={register}
            error={errors?.lastName}
            required
          />
          <InputField
            label="Phone Number"
            name="phone"
            type="tel"
            defaultValue={data?.phone}
            register={register}
            error={errors?.phone}
            inputProps={{ placeholder: "+998901234567" }}
            required
          />
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">
              Parent ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                {...register("parentId")}
                defaultValue={data?.parentId || ""}
                className="border border-gray-300 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
                placeholder="P12345"
              />
              {isCheckingId && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {parentIdError && (
              <p className="text-xs text-red-400">{parentIdError}</p>
            )}
            {errors?.parentId?.message && (
              <p className="text-xs text-red-400">{errors.parentId.message.toString()}</p>
            )}
            <p className="text-xs text-gray-400">
              Format: P##### (e.g., P12345)
            </p>
          </div>
          <PasswordField
            label="Password"
            name="password"
            register={register}
            error={errors?.password}
            inputProps={{ placeholder: type === "create" ? "Enter password" : "Leave empty to keep current password" }}
            required={type === "create"}
          />
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
              {...register("status")}
              defaultValue={data?.status || "ACTIVE"}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            {errors.status?.message && (
              <p className="text-xs text-red-400">
                {errors.status.message.toString()}
              </p>
            )}
          </div>
        </div>

          {/* Branch Information - Only show if not creating from student and not editing */}
  {!isCreatingFromStudent && !isEditing && (
          <>
            <span className="text-xs text-gray-400 font-medium">Branch Information</span>
            <div className="flex justify-between flex-wrap gap-4">
              <div className="flex flex-col gap-2 w-full md:w-1/4">
                <label className="text-xs text-gray-500">Branch <span className="text-red-500">*</span></label>
                <select
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  <option value="">Select Branch</option>
                  {branches?.map((branch: any) => (
                    <option key={branch.id} value={branch.id}>{branch.shortName}</option>
                  ))}
                </select>
                {errors.branchId?.message && (
                  <p className="text-xs text-red-400">{errors.branchId.message.toString()}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full md:w-1/4">
                <label className="text-xs text-gray-500">Class</label>
                <select
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  disabled={!selectedBranchId}
                >
                  <option value="">All Classes</option>
                  {classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student Assignment - Only show if not creating from student */}
            <span className="text-xs text-gray-400 font-medium">Student Assignment</span>
            <div className="flex justify-between flex-wrap gap-4">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-xs text-gray-500">Select Students</label>
                <div className="max-h-56 overflow-auto border rounded-md p-2 bg-white">
                  {!selectedBranchId && (
                    <p className="text-xs text-gray-500">Select a branch to load students.</p>
                  )}
                  {selectedBranchId && Array.isArray(students) && students.length === 0 && (
                    <p className="text-xs text-gray-500">No students found for the selected filter.</p>
                  )}
                  <ul className="space-y-1">
                    {Array.isArray(students) && students.map((s: any) => (
                      <li key={s.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="accent-blue-600"
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={() => toggleStudent(s.id)}
                        />
                        <span>{s.firstName} {s.lastName} — {s.studentId}{s.class?.name ? ` (${s.class.name})` : ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-gray-500">Choose one or more students to assign to this parent.</p>
                {errors.studentIds?.message && (
                  <p className="text-xs text-red-400">{errors.studentIds.message.toString()}</p>
                )}
              </div>
            </div>
          </>
        )}

          {/* Show student info when creating from student context */}
  {isCreatingFromStudent && studentForNewParent && !isEditing && (
          <>
            <span className="text-xs text-gray-400 font-medium">Student Information</span>
            <div className="p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Student:</strong> {studentForNewParent.firstName} {studentForNewParent.lastName}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Student ID:</strong> {studentForNewParent.studentId}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Branch:</strong> {studentForNewParent.branch?.shortName || 'Not assigned'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                This parent will be automatically assigned to the above student and will have access to all student information regardless of current academic assignments.
              </p>
            </div>
          </>
        )}

        {/* Hidden ID field for updates */}
        {data && (
          <input type="hidden" {...register("id")} value={data.id} />
        )}

        {/* Hidden field to bind branchId to RHF for schema validation */}
        <input type="hidden" {...register("branchId", { valueAsNumber: true })} value={selectedBranchId ? Number(selectedBranchId) : ("" as unknown as number)} />

        {state.error && !state.message && (
          <span className="text-red-500">Something went wrong!</span>
        )}
        
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={!!parentIdError || isCheckingId}
          >
            {type === "create" ? "Create" : "Update"} Parent
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default ParentForm;