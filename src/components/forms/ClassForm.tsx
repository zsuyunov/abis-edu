"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { classSchema, ClassSchema } from "@/lib/formValidationSchemas";
import { createClass, updateClass } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ClassForm = ({
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
  } = useForm<ClassSchema>({
    resolver: zodResolver(classSchema),
    defaultValues: type === "update" ? {
      id: data?.id,
      name: data?.name,
      capacity: data?.capacity,
      // grade removed
      branchId: data?.branchId,
      academicYearId: data?.academicYearId || data?.academicYear?.id,
      language: data?.language,
      educationType: data?.educationType,
      status: data?.status,
    } : {
      status: "ACTIVE",
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createClass : updateClass,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  const [branches, setBranches] = useState(relatedData?.branches || []);
  const [teachers, setTeachers] = useState(relatedData?.teachers || []);
  const [academicYears, setAcademicYears] = useState(relatedData?.academicYears || []);

  const selectedBranchId = watch("branchId");

  // Fetch latest data when form opens
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesRes, academicYearsRes] = await Promise.all([
          fetch('/api/branches'),
          fetch('/api/academic-years')
        ]);
        
        if (branchesRes.ok) {
          const branchData = await branchesRes.json();
          setBranches(branchData.branches || []);
        }
        
        if (academicYearsRes.ok) {
          const yearData = await academicYearsRes.json();
          setAcademicYears(yearData.academicYears || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // Supervisor selection moved to Teacher Assignments workflow

  useEffect(() => {
    if (state.success) {
      toast(`Class has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const languageOptions = [
    { value: "UZBEK", label: "Uzbek" },
    { value: "RUSSIAN", label: "Russian" },
    { value: "ENGLISH", label: "English" },
    { value: "CHINESE", label: "Chinese" },
    { value: "ARABIC", label: "Arabic" },
    { value: "KOREAN", label: "Korean" },
    { value: "JAPANESE", label: "Japanese" },
    { value: "FRENCH", label: "French" },
    { value: "GERMAN", label: "German" },
  ];

  const educationTypeOptions = [
    { value: "KINDERGARTEN", label: "Kindergarten" },
    { value: "PRIMARY", label: "Primary" },
    { value: "SECONDARY", label: "Secondary" },
    { value: "HIGH", label: "High School" },
  ];

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new class" : "Update the class"}
      </h1>

      {/* Basic Information */}
      <span className="text-xs text-gray-400 font-medium">
        Basic Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Class Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
          required
        />
        
        <InputField
          label="Capacity"
          name="capacity"
          type="number"
          defaultValue={data?.capacity}
          register={register}
          error={errors?.capacity}
          required
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Branch <span className="text-red-500">*</span>
          </label>
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
          {errors?.branchId?.message && (
            <p className="text-xs text-red-400">
              {errors.branchId.message.toString()}
            </p>
          )}
        </div>

        {/* Grade removed per request */}
      </div>

      {/* Academic Information */}
      <span className="text-xs text-gray-400 font-medium">
        Academic Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Academic Year <span className="text-red-500">*</span>
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
            {...register("academicYearId")}
            defaultValue={data?.academicYearId || data?.academicYear?.id}
          >
            <option value="">Select Academic Year</option>
            {academicYears.map((year: any) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
          {errors?.academicYearId?.message && (
            <p className="text-xs text-red-400">
              {errors.academicYearId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Language <span className="text-red-500">*</span>
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
            {...register("language")}
            defaultValue={data?.language}
          >
            <option value="">Select Language</option>
            {languageOptions.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          {errors?.language?.message && (
            <p className="text-xs text-red-400">
              {errors.language.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Education Type <span className="text-red-500">*</span>
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900"
            {...register("educationType")}
            defaultValue={data?.educationType}
          >
            <option value="">Select Education Type</option>
            {educationTypeOptions.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors?.educationType?.message && (
            <p className="text-xs text-red-400">
              {errors.educationType.message.toString()}
            </p>
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
          {errors?.status?.message && (
            <p className="text-xs text-red-400">
              {errors.status.message.toString()}
            </p>
          )}
        </div>
      </div>

      {/* Supervisor assignment removed from Class form. Use Teacher Assignments page. */}

      {/* Hidden field for creation date */}
      {type === "update" && (
        <input type="hidden" {...register("id")} value={data?.id} />
      )}

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="bg-gray-400 text-white p-2 rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-400 text-white p-2 rounded-md"
        >
          {type === "create" ? "Create" : "Update"}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;