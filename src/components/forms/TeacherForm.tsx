"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import PasswordInput from "../PasswordInput";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  teacherSchema,
  teacherUpdateSchema,
  TeacherSchema,
  TeacherUpdateSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import {
  createTeacher,
  updateTeacher,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ImageKitUpload from "../ImageKitUpload";
import IdInputField from "../IdInputField";

const TeacherForm = ({
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
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
  } = useForm<TeacherSchema | TeacherUpdateSchema>({
    resolver: zodResolver(type === "update" ? teacherUpdateSchema : teacherSchema),
    mode: "onSubmit", // Only validate on submit
  });

  const [state, formAction] = useFormState(
    type === "create" ? createTeacher : updateTeacher,
    {
      success: false,
      error: false,
    }
  );

  const [attachments, setAttachments] = useState<{
    passport?: any;
    resume?: any;
    photo?: any;
  }>({});

  const onSubmit = handleSubmit((data) => {
    console.log("Form data submitted:", data);
    console.log("Teacher ID value:", data.teacherId);
    console.log("Form errors:", errors);
    console.log("Form isValid:", isValid);
    console.log("Form isDirty:", isDirty);
    // Include attachment URLs in the data
    const formDataWithAttachments = {
      ...data,
      attachments: attachments,
      // For updates, only include password if it's a non-empty string
      ...(type === "update" ? (data.password && data.password.trim() !== '' ? { password: data.password } : {}) : {}),
    };
    console.log("Final form data:", formDataWithAttachments);
    formAction(formDataWithAttachments as any);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Teacher has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const [teacherIdError, setTeacherIdError] = useState<string>("");
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [generatedTeacherId, setGeneratedTeacherId] = useState<string>("");

  // Teacher ID validation function
  const validateTeacherId = async (teacherId: string) => {
    if (!teacherId) {
      setTeacherIdError("");
      return;
    }

    // Check format
    if (!teacherId.match(/^T\d{5}$/)) {
      if (teacherId.match(/^t\d{5}$/)) {
        setTeacherIdError("Teacher ID must start with capital 'T'. Please use T instead of t.");
      } else if (teacherId.match(/^\d{5}$/)) {
        setTeacherIdError("Teacher ID must start with 'T'. Please add T before the numbers.");
      } else {
        setTeacherIdError("Teacher ID must be in format T##### (e.g., T12345)");
      }
      return;
    }

    // For updates, allow keeping the same ID
    if (type === "update" && teacherId === data?.teacherId) {
      setTeacherIdError("");
      return;
    }

    // Check if ID already exists
    setIsCheckingId(true);
    try {
      const response = await fetch(`/api/check-teacher-id?teacherId=${teacherId}`);
      const data = await response.json();
      
      if (data.exists) {
        setTeacherIdError("This Teacher ID is already taken. Please use a different ID.");
      } else {
        setTeacherIdError("");
      }
    } catch (error) {
      console.error("Error checking teacher ID:", error);
      setTeacherIdError("Error checking Teacher ID availability. Please try again.");
    } finally {
      setIsCheckingId(false);
    }
  };

  // Auto-generate teacher ID function
  const generateTeacherId = async () => {
    if (type === "update") {
      toast.error("Cannot auto-generate ID for existing teachers");
      return;
    }

    setIsGeneratingId(true);
    setTeacherIdError("");
    
    try {
      const response = await fetch('/api/teachers/generate-id');
      const data = await response.json();
      
      if (data.success) {
        setGeneratedTeacherId(data.teacherId);
        // Update the form field value
        const teacherIdInput = document.querySelector('input[name="teacherId"]') as HTMLInputElement;
        if (teacherIdInput) {
          teacherIdInput.value = data.teacherId;
          // Trigger validation
          validateTeacherId(data.teacherId);
        }
        toast.success(`Generated Teacher ID: ${data.teacherId}`);
      } else {
        setTeacherIdError(data.error || "Failed to generate Teacher ID");
        toast.error("Failed to generate Teacher ID");
      }
    } catch (error) {
      console.error("Error generating teacher ID:", error);
      setTeacherIdError("Error generating Teacher ID. Please try again.");
      toast.error("Error generating Teacher ID");
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Debounced teacher ID validation
  useEffect(() => {
    const timer = setTimeout(() => {
      const teacherId = watch("teacherId");
      if (teacherId) {
        validateTeacherId(teacherId);
      } else {
        setTeacherIdError("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watch("teacherId")]);



  return (
    <form className="flex flex-col gap-8 max-h-[80vh] overflow-y-auto" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new teacher" : "Update the teacher"}
      </h1>
      
      {/* Basic Information */}
      <span className="text-xs text-gray-400 font-medium">
        Basic Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("firstName")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="John"
            defaultValue={data?.firstName}
          />
          {errors?.firstName?.message && (
            <p className="text-xs text-red-400">{errors.firstName.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("lastName")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="Doe"
            defaultValue={data?.lastName}
          />
          {errors?.lastName?.message && (
            <p className="text-xs text-red-400">{errors.lastName.message.toString()}</p>
          )}
        </div>
        
        <div className="flex flex-col gap-2 w-full md:w-1/4">
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

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Date of Birth
          </label>
          <input
            type="date"
            {...register("dateOfBirth")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
            defaultValue={data?.dateOfBirth ? data.dateOfBirth.toISOString().split("T")[0] : ""}
          />
          {errors?.dateOfBirth?.message && (
            <p className="text-xs text-red-400">{errors.dateOfBirth.message.toString()}</p>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <span className="text-xs text-gray-400 font-medium">
        Contact Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            {...register("phone")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="+998901234567"
            defaultValue={data?.phone}
          />
          {errors?.phone?.message && (
            <p className="text-xs text-red-400">{errors.phone.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Teacher ID <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              {...register("teacherId")}
              className="ring-[1.5px] ring-gray-300 p-2 pr-10 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
              placeholder="T12345"
              defaultValue={data?.teacherId || generatedTeacherId || ""}
            />
            {type === "create" && (
              <button
                type="button"
                onClick={generateTeacherId}
                disabled={isGeneratingId}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                title="Auto-generate unique Teacher ID"
              >
                {isGeneratingId ? "..." : "A"}
              </button>
            )}
          </div>
          {errors?.teacherId?.message && (
            <p className="text-xs text-red-400">{errors.teacherId.message.toString()}</p>
          )}
          <p className="text-xs text-gray-400">
            Format: T##### (e.g., T12345)
            {type === "create" && " • Click 'A' to generate"}
          </p>
          {teacherIdError && (
            <p className="text-xs text-red-400">{teacherIdError}</p>
          )}
          {isCheckingId && (
            <p className="text-xs text-gray-400">Checking ID...</p>
          )}
          {isGeneratingId && (
            <p className="text-xs text-gray-400">Generating ID...</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Password {type === "create" && <span className="text-red-500">*</span>}
          </label>
          <PasswordInput
            register={register("password")}
            error={errors?.password}
            placeholder={type === "create" ? "Enter password" : "Leave empty to keep current password"}
            defaultValue=""
            required={type === "create"}
          />
        </div>

        <InputField
          label="Email"
          name="email"
          type="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
          inputProps={{ placeholder: "john.doe@school.uz" }}
          required={false}
        />
        
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Address
          </label>
          <input
            type="text"
            {...register("address")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="123 Main Street, Tashkent"
            defaultValue={data?.address}
          />
          {errors?.address?.message && (
            <p className="text-xs text-red-400">{errors.address.message.toString()}</p>
          )}
        </div>

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

      {/* Assignment Information */}
      <span className="text-xs text-gray-400 font-medium">
        Assignment Information
      </span>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-blue-700 font-medium mb-1">📝 Teacher Assignment Workflow</p>
        <p className="text-xs text-blue-600">
          Teachers are created as global users and can be assigned to teach in multiple branches.
          Use the separate "Teacher Assignments" section to assign teachers to specific branches, classes, and subjects.
        </p>
      </div>
      <div className="flex justify-between flex-wrap gap-4">
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
      </div>

      {/* Passport Information */}
      <span className="text-xs text-gray-400 font-medium">
        Passport Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Country"
          name="passport.country"
          defaultValue={data?.passport?.country}
          register={register}
          error={errors?.passport?.country}
          inputProps={{ placeholder: "e.g., Uzbekistan, Russia, etc." }}
          required={false}
        />

        <InputField
          label="Document Number"
          name="passport.documentNumber"
          defaultValue={data?.passport?.documentNumber}
          register={register}
          error={errors?.passport?.documentNumber}
          inputProps={{ placeholder: "AA1234567" }}
          required={false}
        />
        
        <InputField
          label="Issue Date"
          name="passport.issueDate"
          type="date"
          defaultValue={data?.passport?.issueDate ? data.passport.issueDate.toISOString().split("T")[0] : ""}
          register={register}
          error={errors?.passport?.issueDate}
          required={false}
        />
        
        <InputField
          label="Expiry Date"
          name="passport.expiryDate"
          type="date"
          defaultValue={data?.passport?.expiryDate ? data.passport.expiryDate.toISOString().split("T")[0] : ""}
          register={register}
          error={errors?.passport?.expiryDate}
          required={false}
        />
      </div>

      {/* Education Information */}
      <span className="text-xs text-gray-400 font-medium">
        Education Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Institution Name"
          name="education.institutionName"
          defaultValue={data?.education?.institutionName}
          register={register}
          error={errors?.education?.institutionName}
          inputProps={{ placeholder: "Tashkent State University" }}
          required={false}
        />
        
        <InputField
          label="Specialization"
          name="education.specialization"
          defaultValue={data?.education?.specialization}
          register={register}
          error={errors?.education?.specialization}
          inputProps={{ placeholder: "Mathematics, Physics, etc." }}
          required={false}
        />
        
        <InputField
          label="Document Series (Diplom raqami)"
          name="education.documentSeries"
          defaultValue={data?.education?.documentSeries}
          register={register}
          error={errors?.education?.documentSeries}
          inputProps={{ placeholder: "AB123456" }}
          required={false}
        />
        
        <InputField
          label="Graduation Date"
          name="education.graduationDate"
          type="date"
          defaultValue={data?.education?.graduationDate ? data.education.graduationDate.toISOString().split("T")[0] : ""}
          register={register}
          error={errors?.education?.graduationDate}
          required={false}
        />
        
        <InputField
          label="Language Skills"
          name="education.languageSkills"
          defaultValue={data?.education?.languageSkills}
          register={register}
          error={errors?.education?.languageSkills}
          inputProps={{ placeholder: "English (B2), Russian (C1), etc." }}
          required={false}
        />
      </div>

      {/* Document Attachments */}
      <span className="text-xs text-gray-400 font-medium">
        Document Attachments
      </span>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Passport Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Passport PDF</label>
            <ImageKitUpload
              onSuccess={(result) => {
                setAttachments(prev => ({ ...prev, passport: result }));
                toast.success("Passport uploaded successfully!");
              }}
              onError={(error) => {
                console.error("Passport upload failed:", error);
                toast.error("Passport upload failed!");
              }}
            />
            {attachments.passport && (
              <p className="text-xs text-green-600">Passport uploaded ✓</p>
            )}
          </div>

          {/* Resume Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Resume PDF</label>
            <ImageKitUpload
              onSuccess={(result) => {
                setAttachments(prev => ({ ...prev, resume: result }));
                toast.success("Resume uploaded successfully!");
              }}
              onError={(error) => {
                console.error("Resume upload failed:", error);
                toast.error("Resume upload failed!");
              }}
            />
            {attachments.resume && (
              <p className="text-xs text-green-600">Resume uploaded ✓</p>
            )}
          </div>

          {/* Photo Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">3x4 Photo</label>
            <ImageKitUpload
              onSuccess={(result) => {
                setAttachments(prev => ({ ...prev, photo: result }));
                toast.success("Photo uploaded successfully!");
              }}
              onError={(error) => {
                console.error("Photo upload failed:", error);
                toast.error("Photo upload failed!");
              }}
            />
            {attachments.photo && (
              <p className="text-xs text-green-600">Photo uploaded ✓</p>
            )}
          </div>
        </div>
      </div>

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default TeacherForm;