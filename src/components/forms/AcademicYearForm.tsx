"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect } from "react";
import {
  academicYearSchema,
  AcademicYearSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createAcademicYear, updateAcademicYear } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const AcademicYearForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<AcademicYearSchema>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: type === "update" ? {
      id: data?.id,
      name: data?.name,
      startDate: data?.startDate ? new Date(data.startDate) : new Date(),
      endDate: data?.endDate ? new Date(data.endDate) : new Date(),
      status: data?.status || "ACTIVE",
      semesters: data?.semesters?.map((sem: any) => ({
        id: sem.id,
        name: sem.name,
        startDate: new Date(sem.startDate),
        endDate: new Date(sem.endDate),
      })) || [
        {
          name: "First Semester",
          startDate: new Date(),
          endDate: new Date(),
        }
      ],
    } : {
      status: "ACTIVE",
      startDate: new Date(),
      endDate: new Date(),
      semesters: [
        {
          name: "First Semester",
          startDate: new Date(),
          endDate: new Date(),
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "semesters",
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAcademicYear : updateAcademicYear,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  const onSubmit = handleSubmit((data) => {
    console.log("Academic Year form data:", data);
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      toast.success(`Academic year "${watch('name')}" has been ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) {
      const errorMessage = (state as any).message || `Failed to ${type === "create" ? "create" : "update"} academic year!`;
      toast.error(errorMessage);
    }
  }, [state, router, type, setOpen, watch]);

  const addSemester = () => {
    append({
      name: `Semester ${fields.length + 1}`,
      startDate: new Date(),
      endDate: new Date(),
    });
  };

  const removeSemester = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new academic year" : "Update academic year"}
      </h1>

      {/* Basic Information */}
      <span className="text-xs text-gray-400 font-medium">
        Basic Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Academic Year Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
          inputProps={{ placeholder: "e.g., 2024-2025" }}
        />
        
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("startDate")}
            defaultValue={data?.startDate ? new Date(data.startDate).toISOString().split('T')[0] : ""}
          />
          {errors?.startDate?.message && (
            <p className="text-xs text-red-400">
              {errors.startDate.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("endDate")}
            defaultValue={data?.endDate ? new Date(data.endDate).toISOString().split('T')[0] : ""}
          />
          {errors?.endDate?.message && (
            <p className="text-xs text-red-400">
              {errors.endDate.message.toString()}
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
            defaultValue={data?.status}
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

      {/* Set-current removed by requirements */}

      {/* Semesters Section */}
      <span className="text-xs text-gray-400 font-medium">
        Semesters
      </span>
      
      <div className="flex flex-col gap-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                Semester {index + 1}
              </h3>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSemester(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="flex gap-4 flex-wrap">
              <div className="flex flex-col gap-2 w-full md:w-1/3">
                <label className="text-xs text-gray-500">
                  Semester Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                  {...register(`semesters.${index}.name` as const)}
                  placeholder="e.g., First Semester"
                />
                {errors?.semesters?.[index]?.name?.message && (
                  <p className="text-xs text-red-400">
                    {errors.semesters[index]?.name?.message.toString()}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full md:w-1/3">
                <label className="text-xs text-gray-500">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                  {...register(`semesters.${index}.startDate` as const)}
                />
                {errors?.semesters?.[index]?.startDate?.message && (
                  <p className="text-xs text-red-400">
                    {errors.semesters[index]?.startDate?.message.toString()}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full md:w-1/3">
                <label className="text-xs text-gray-500">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                  {...register(`semesters.${index}.endDate` as const)}
                />
                {errors?.semesters?.[index]?.endDate?.message && (
                  <p className="text-xs text-red-400">
                    {errors.semesters[index]?.endDate?.message.toString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addSemester}
          className="bg-blue-100 text-blue-600 p-2 rounded-md text-sm hover:bg-blue-200 transition-colors"
        >
          + Add Semester
        </button>
      </div>

      {/* Hidden field for update */}
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

export default AcademicYearForm;
