"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import InputField from "../InputField";
import PasswordInput from "../PasswordInput";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  studentSchema,
  studentUpdateSchema,
  StudentSchema,
  StudentUpdateSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import {
  createStudent,
  updateStudent,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ImageKitUpload from "../ImageKitUpload";

const StudentForm = ({
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
  const methods = useForm<StudentSchema | StudentUpdateSchema>({
    resolver: zodResolver(type === "update" ? studentUpdateSchema : studentSchema),
    defaultValues: type === "update" ? {
      id: data?.id,
      firstName: data?.firstName,
      lastName: data?.lastName,
      dateOfBirth: data?.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      phone: data?.phone,
      studentId: data?.studentId,
      password: "",
      gender: data?.gender,
      status: data?.status || "ACTIVE",
      parentId: data?.parentId || undefined,
    } : {
      status: "ACTIVE",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = methods;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Branch and class assignment is handled in Student Assignments section
  const [attachments, setAttachments] = useState<{
    document1: any;
    document2: any;
    image1: any;
    image2: any;
  }>({
    document1: undefined,
    document2: undefined,
    image1: undefined,
    image2: undefined,
  });

  const [studentIdError, setStudentIdError] = useState<string>("");
  const [isCheckingId, setIsCheckingId] = useState(false);

  const [state, formAction] = useFormState(
    type === "create" ? createStudent : updateStudent,
    {
      success: false,
      error: false,
      message: "",
    }
  );

  // Student ID validation function
  const validateStudentId = async (studentId: string) => {
    if (!studentId) {
      setStudentIdError("");
      return;
    }

    // Check format
    if (!studentId.match(/^S\d{5}$/)) {
      if (studentId.match(/^s\d{5}$/)) {
        setStudentIdError("Student ID must start with capital 'S'. Please use S instead of s.");
      } else if (studentId.match(/^\d{5}$/)) {
        setStudentIdError("Student ID must start with 'S'. Please add S before the numbers.");
      } else {
        setStudentIdError("Student ID must be in format S##### (e.g., S12345)");
      }
      return;
    }

    // For updates, allow keeping the same ID
    if (type === "update" && studentId === data?.studentId) {
      setStudentIdError("");
      return;
    }

    // Check if ID already exists
    setIsCheckingId(true);
    try {
      const response = await fetch(`/api/check-student-id?studentId=${studentId}`);
      const responseData = await response.json();
      
      if (responseData.exists) {
        setStudentIdError("This Student ID is already taken. Please use a different ID.");
      } else {
        setStudentIdError("");
      }
    } catch (error) {
      console.error("Error checking student ID:", error);
      setStudentIdError("Error checking Student ID availability. Please try again.");
    } finally {
      setIsCheckingId(false);
    }
  };

  // Debounced student ID validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const studentId = watch("studentId");
      if (studentId) {
        validateStudentId(studentId);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watch("studentId"), type, data?.studentId]);

  // Remove onSubmit since we're using useFormState with action prop

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Student has been ${type === "create" ? "created" : "updated"} successfully!`);
      setIsSubmitting(false);
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 500);
    }
    if (state.error) {
      toast.error(state.message || `Failed to ${type === "create" ? "create" : "update"} student!`);
      setIsSubmitting(false);
    }
  }, [state, router, type, setOpen]);

  // Timeout mechanism - if submitting for more than 30 seconds, reset
  useEffect(() => {
    if (isSubmitting) {
      const timeout = setTimeout(() => {
        console.warn("⏰ Form submission timeout - resetting");
        setIsSubmitting(false);
        toast.error("Request timeout. Please try again.");
      }, 30000); // 30 seconds

      return () => clearTimeout(timeout);
    }
  }, [isSubmitting]);

  return (
    <FormProvider {...methods}>
      <form className="flex flex-col gap-4 sm:gap-6" action={formAction}>
        <h1 className="text-base sm:text-lg font-semibold">
          {type === "create" ? "Create a new student" : "Update the student"}
        </h1>

        {/* Basic Information */}
        <span className="text-xs text-gray-400 font-medium">
          Basic Information
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("firstName")}
              defaultValue={data?.firstName}
              className="border border-gray-300 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
              placeholder="Enter first name"
            />
            {errors.firstName?.message && (
              <p className="text-xs text-red-400">{errors.firstName.message.toString()}</p>
            )}
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("lastName")}
              defaultValue={data?.lastName}
              className="border border-gray-300 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
              placeholder="Enter last name"
            />
            {errors.lastName?.message && (
              <p className="text-xs text-red-400">{errors.lastName.message.toString()}</p>
            )}
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              Date of Birth (optional)
            </label>
            <input
              type="date"
              {...register("dateOfBirth")}
              defaultValue={data?.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split("T")[0] : ""}
              className="border border-gray-300 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            />
            {errors.dateOfBirth?.message && (
              <p className="text-xs text-red-400">{errors.dateOfBirth.message.toString()}</p>
            )}
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register("phone")}
              defaultValue={data?.phone}
              className="border border-gray-300 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
              placeholder="+998901234567"
            />
            {errors.phone?.message && (
              <p className="text-xs text-red-400">{errors.phone.message.toString()}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              Student ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                {...register("studentId")}
                defaultValue={data?.studentId || ""}
                className="border border-gray-300 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
                placeholder="S12345"
              />
              {isCheckingId && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {studentIdError && (
              <p className="text-xs text-red-400">{studentIdError}</p>
            )}
            {errors?.studentId?.message && (
              <p className="text-xs text-red-400">{errors.studentId.message.toString()}</p>
            )}
            <p className="text-xs text-gray-400">
              Format: S##### (e.g., S12345)
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              Password {type === "create" && <span className="text-red-500">*</span>}
            </label>
            <PasswordInput
              register={register("password")}
              error={errors.password}
              placeholder={type === "create" ? "Enter password" : "Leave empty to keep current password"}
              defaultValue=""
              required={type === "create"}
            />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
              {...register("gender")}
              defaultValue={data?.gender}
            >
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            {errors.gender?.message && (
              <p className="text-xs text-red-400">
                {errors.gender.message.toString()}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full">
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

        {/* Branch and Class Selection */}
        <span className="text-xs text-gray-400 font-medium">
          Branch and Class Information
        </span>
        {/* Branch and Class assignment moved to Student Assignments section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Branch and class assignments are now handled in the separate "Student Assignments" section after student creation.
          </p>
        </div>

        {/* Note: Parents can be assigned later through the parent creation form */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Students can be created without parents. Parents can be assigned later through the parent creation form by providing student IDs.
          </p>
        </div>

        {/* Document Uploads - reuse SimpleFileUpload approach from Teacher form */}
        <span className="text-xs text-gray-400 font-medium">
          Document Uploads (Optional)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Passport / Document</label>
            <ImageKitUpload
              onSuccess={(result) => {
                setAttachments(prev => ({ ...prev, document1: result }));
                toast.success("Document uploaded successfully!");
              }}
              onError={(error) => {
                console.error("Upload failed:", error);
                toast.error("Document upload failed!");
              }}
            />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Additional Document</label>
            <ImageKitUpload
              onSuccess={(result) => {
                setAttachments(prev => ({ ...prev, document2: result }));
                toast.success("Document uploaded successfully!");
              }}
              onError={(error) => {
                console.error("Upload failed:", error);
                toast.error("Document upload failed!");
              }}
            />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Student Photo</label>
            <ImageKitUpload
              onSuccess={(result) => {
                setAttachments(prev => ({ ...prev, image1: result }));
                toast.success("Image uploaded successfully!");
              }}
              onError={(error) => {
                console.error("Upload failed:", error);
                toast.error("Image upload failed!");
              }}
            />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Additional Image</label>
            <ImageKitUpload
              onSuccess={(result) => {
                setAttachments(prev => ({ ...prev, image2: result }));
                toast.success("Image uploaded successfully!");
              }}
              onError={(error) => {
                console.error("Upload failed:", error);
                toast.error("Image upload failed!");
              }}
            />
          </div>
        </div>

        {/* Hidden fields for form data */}
        {data && (
          <input type="hidden" {...register("id")} value={data.id} />
        )}
        
        {/* Hidden fields for attachments */}
        {attachments.document1 && (
          <input type="hidden" name="document1" value={JSON.stringify(attachments.document1)} />
        )}
        {attachments.document2 && (
          <input type="hidden" name="document2" value={JSON.stringify(attachments.document2)} />
        )}
        {attachments.image1 && (
          <input type="hidden" name="image1" value={JSON.stringify(attachments.image1)} />
        )}
        {attachments.image2 && (
          <input type="hidden" name="image2" value={JSON.stringify(attachments.image2)} />
        )}

        {state.error && (
          <span className="text-red-500">
            {state.message || "Something went wrong!"}
          </span>
        )}
        
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="px-3 py-2 text-sm bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || studentIdError !== ""}
            onClick={(e) => {
              if (studentIdError) {
                e.preventDefault();
                toast.error("Please fix Student ID error before submitting");
                return;
              }
              setIsSubmitting(true);
            }}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isSubmitting ? "Processing..." : `${type === "create" ? "Create" : "Update"} Student`}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default StudentForm;