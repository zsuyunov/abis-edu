"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import PasswordField from "../PasswordField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  userSchema,
  userUpdateSchema,
  UserSchema,
  UserUpdateSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import {
  createUser,
  updateUser,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ImageKitUpload from "../ImageKitUpload";

const UserForm = ({
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
    formState: { errors },
    watch,
  } = useForm<UserSchema | UserUpdateSchema>({
    resolver: zodResolver(type === "update" ? userUpdateSchema : userSchema),
  });

  const [attachments, setAttachments] = useState<{
    passport?: any;
    resume?: any;
    photo?: any;
  }>({});

  const [state, formAction] = useFormState(
    type === "create" ? createUser : updateUser,
    {
      success: false,
      error: false,
    }
  );

  const selectedPosition = watch("position");

  // Positions that don't require branch selection
  const noBranchPositions = ["MAIN_DIRECTOR", "MAIN_HR", "MAIN_ADMISSION"];

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    // Include attachment URLs in the data
    const formDataWithAttachments = {
      ...data,
      attachments: attachments,
    };
    formAction(formDataWithAttachments);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`User has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const [branches, setBranches] = useState(relatedData?.branches || []);
  const [userIdError, setUserIdError] = useState<string>("");
  const [isCheckingId, setIsCheckingId] = useState(false);

  // Fetch latest branches when form opens
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch('/api/branches');
        if (response.ok) {
          const data = await response.json();
          setBranches(data.branches || []);
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        // Fallback to initial data
        setBranches(relatedData?.branches || []);
      }
    };

    fetchBranches();
  }, [relatedData?.branches]);

  // User ID validation function
  const validateUserId = async (userId: string) => {
    if (!userId) {
      setUserIdError("");
      return;
    }

    // Check format based on position
    const validFormats = {
      MAIN_DIRECTOR: /^MD\d{5}$/,
      SUPPORT_DIRECTOR: /^SD\d{5}$/,
      MAIN_HR: /^MH\d{5}$/,
      SUPPORT_HR: /^SH\d{5}$/,
      MAIN_ADMISSION: /^MA\d{5}$/,
      SUPPORT_ADMISSION: /^SA\d{5}$/,
      DOCTOR: /^D\d{5}$/,
      CHIEF: /^C\d{5}$/,
    };

    const selectedPosition = watch("position");
    if (!selectedPosition) {
      setUserIdError("Please select a position first to validate User ID format.");
      return;
    }

    const format = validFormats[selectedPosition as keyof typeof validFormats];
    if (!format || !userId.match(format)) {
      const expectedFormat = {
        MAIN_DIRECTOR: "MD#####",
        SUPPORT_DIRECTOR: "SD#####",
        MAIN_HR: "MH#####",
        SUPPORT_HR: "SH#####",
        MAIN_ADMISSION: "MA#####",
        SUPPORT_ADMISSION: "SA#####",
        DOCTOR: "D#####",
        CHIEF: "C#####",
      }[selectedPosition];
      setUserIdError(`User ID must be in format ${expectedFormat} (e.g., ${expectedFormat.replace("#", "1")})`);
      return;
    }

    // For updates, allow keeping the same ID
    if (type === "update" && userId === data?.userId) {
      setUserIdError("");
      return;
    }

    // Check if ID already exists
    setIsCheckingId(true);
    try {
      const response = await fetch(`/api/check-user-id?userId=${userId}`);
      const responseData = await response.json();
      
      if (responseData.exists) {
        setUserIdError("This User ID is already taken. Please use a different ID.");
      } else {
        setUserIdError("");
      }
    } catch (error) {
      console.error("Error checking user ID:", error);
      setUserIdError("Error checking User ID availability. Please try again.");
    } finally {
      setIsCheckingId(false);
    }
  };

  // Debounced user ID validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const userId = watch("userId");
      if (userId) {
        validateUserId(userId);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watch("userId"), watch("position"), type, data?.userId]);

  const positionLabels = {
    MAIN_DIRECTOR: "Main Director",
    SUPPORT_DIRECTOR: "Support Director", 
    MAIN_HR: "Main HR",
    SUPPORT_HR: "Support HR",
    MAIN_ADMISSION: "Main Admission",
    SUPPORT_ADMISSION: "Support Admission",
    DOCTOR: "Doctor",
    CHIEF: "Chief",
  };

  const countryLabels = {
    UZBEKISTAN: "Uzbekistan",
    RUSSIA: "Russia",
    KAZAKHSTAN: "Kazakhstan",
    KYRGYZSTAN: "Kyrgyzstan",
    TAJIKISTAN: "Tajikistan",
    TURKMENISTAN: "Turkmenistan",
    OTHER: "Other",
  };

  return (
    <form className="flex flex-col gap-8 max-h-[80vh] overflow-y-auto" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new user" : "Update the user"}
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
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register("dateOfBirth")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
            defaultValue={data?.dateOfBirth?.toISOString().split("T")[0]}
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





        <InputField
          label="Email"
          name="email"
          type="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
          inputProps={{ placeholder: "john.doe@school.uz" }}
        />
        
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Address <span className="text-red-500">*</span>
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
        <PasswordField
          label="Password"
          name="password"
          defaultValue=""
          register={register}
          error={errors.password}
          required={type === "create"}
          inputProps={{ placeholder: type === "create" ? "Required" : "Leave empty to keep current" }}
        />
      </div>

      {/* Position and Branch */}
      <span className="text-xs text-gray-400 font-medium">
        Position and Branch
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Position <span className="text-red-500">*</span>
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
            {...register("position")}
            defaultValue={data?.position}
          >
            <option value="">Select Position</option>
            {Object.entries(positionLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          {errors.position?.message && (
            <p className="text-xs text-red-400">
              {errors.position.message.toString()}
            </p>
          )}
        </div>

        {selectedPosition && (
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">
              User ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                {...register("userId")}
                defaultValue={data?.userId || ""}
                className="border border-gray-300 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
                placeholder={(() => {
                  const format = {
                    MAIN_DIRECTOR: "MD12345",
                    SUPPORT_DIRECTOR: "SD12345",
                    MAIN_HR: "MH12345",
                    SUPPORT_HR: "SH12345",
                    MAIN_ADMISSION: "MA12345",
                    SUPPORT_ADMISSION: "SA12345",
                    DOCTOR: "D12345",
                    CHIEF: "C12345",
                  }[selectedPosition];
                  return format || "Select position first";
                })()}
              />
              {isCheckingId && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {userIdError && (
              <p className="text-xs text-red-400">{userIdError}</p>
            )}
            {errors?.userId?.message && (
              <p className="text-xs text-red-400">{errors.userId.message.toString()}</p>
            )}
            <p className="text-xs text-gray-400">
              Format: {(() => {
                const format = {
                  MAIN_DIRECTOR: "MD#####",
                  SUPPORT_DIRECTOR: "SD#####",
                  MAIN_HR: "MH#####",
                  SUPPORT_HR: "SH#####",
                  MAIN_ADMISSION: "MA#####",
                  SUPPORT_ADMISSION: "SA#####",
                  DOCTOR: "D#####",
                  CHIEF: "C#####",
                }[selectedPosition];
                return format || "Select position first";
              })()}
            </p>
          </div>
        )}

        {!noBranchPositions.includes(selectedPosition) && (
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Branch</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
              {...register("branchId")}
              defaultValue={data?.branchId}
            >
              <option value="">Select Branch</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName} - {branch.district}
                </option>
              ))}
            </select>
            {errors.branchId?.message && (
              <p className="text-xs text-red-400">
                {errors.branchId.message.toString()}
              </p>
            )}
          </div>
        )}

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
          required
        />

        <InputField
          label="Document Number"
          name="passport.documentNumber"
          defaultValue={data?.passport?.documentNumber}
          register={register}
          error={errors?.passport?.documentNumber}
          inputProps={{ placeholder: "AA1234567" }}
          required
        />
        
        <InputField
          label="Issue Date"
          name="passport.issueDate"
          type="date"
          defaultValue={data?.passport?.issueDate?.toISOString().split("T")[0]}
          register={register}
          error={errors?.passport?.issueDate}
          required
        />
        
        <InputField
          label="Expiry Date"
          name="passport.expiryDate"
          type="date"
          defaultValue={data?.passport?.expiryDate?.toISOString().split("T")[0]}
          register={register}
          error={errors?.passport?.expiryDate}
          required
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
          required
        />
        
        <InputField
          label="Specialization"
          name="education.specialization"
          defaultValue={data?.education?.specialization}
          register={register}
          error={errors?.education?.specialization}
          inputProps={{ placeholder: "Computer Science" }}
          required
        />
        
        <InputField
          label="Document Series (Diplom raqami)"
          name="education.documentSeries"
          defaultValue={data?.education?.documentSeries}
          register={register}
          error={errors?.education?.documentSeries}
          inputProps={{ placeholder: "AB123456" }}
          required
        />
        
        <InputField
          label="Graduation Date"
          name="education.graduationDate"
          type="date"
          defaultValue={data?.education?.graduationDate?.toISOString().split("T")[0]}
          register={register}
          error={errors?.education?.graduationDate}
          required
        />
        
        <InputField
          label="Language Skills"
          name="education.languageSkills"
          defaultValue={data?.education?.languageSkills}
          register={register}
          error={errors?.education?.languageSkills}
          inputProps={{ placeholder: "English (B2), Russian (C1)" }}
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
      <button type="submit" className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default UserForm;
