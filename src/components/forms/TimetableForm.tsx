"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import InputField from "../InputField";
import { timetableSchema, TimetableSchema } from "@/lib/formValidationSchemas";
import { createTimetable, updateTimetable } from "@/lib/actions";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";

const TimetableForm = ({
  type,
  data,
  relatedData,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  relatedData?: any;
  setOpen: (open: boolean) => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TimetableSchema>({
    resolver: zodResolver(timetableSchema),
    defaultValues: data
      ? {
          ...data,
          fullDate: new Date(data.fullDate),
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
        }
      : undefined,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createTimetable : updateTimetable,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  // Watch form values for dynamic filtering
  const watchBranchId = watch("branchId");
  const watchAcademicYearId = watch("academicYearId");
  const watchFullDate = watch("fullDate");

  // State for filtered data
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);

  useEffect(() => {
    if (state.success) {
      toast.success(`Timetable ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  useEffect(() => {
    if (state.error) {
      toast.error(`Failed to ${type} timetable!`);
    }
  }, [state, type]);

  // Filter classes based on selected branch and academic year
  useEffect(() => {
    if (watchBranchId && watchAcademicYearId && relatedData?.classes) {
      const filtered = relatedData.classes.filter(
        (cls: any) =>
          cls.branchId === parseInt(watchBranchId.toString()) &&
          cls.academicYearId === parseInt(watchAcademicYearId.toString()) &&
          cls.status === "ACTIVE"
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses([]);
    }
  }, [watchBranchId, watchAcademicYearId, relatedData?.classes]);

  // Filter teachers based on selected branch
  useEffect(() => {
    if (watchBranchId && relatedData?.teachers) {
      const filtered = relatedData.teachers.filter(
        (teacher: any) =>
          teacher.branchId === parseInt(watchBranchId.toString()) &&
          teacher.status === "ACTIVE"
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers([]);
    }
  }, [watchBranchId, relatedData?.teachers]);

  // Auto-set day when date changes
  useEffect(() => {
    if (watchFullDate) {
      const dayOfWeek = watchFullDate.getDay();
      const dayMap = {
        0: "SUNDAY",
        1: "MONDAY",
        2: "TUESDAY",
        3: "WEDNESDAY",
        4: "THURSDAY",
        5: "FRIDAY",
        6: "SATURDAY"
      };
      setValue("day", dayMap[dayOfWeek as keyof typeof dayMap] as any);
    }
  }, [watchFullDate, setValue]);

  const onSubmit = handleSubmit((formData) => {
    const formDataObj = new FormData();
    
    // Add all form data
    Object.keys(formData).forEach((key) => {
      const value = formData[key as keyof TimetableSchema];
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          formDataObj.append(key, value.toISOString());
        } else {
          formDataObj.append(key, value.toString());
        }
      }
    });

    formAction(formDataObj as any);
  });

  const {
    branches = [],
    academicYears = [],
    subjects = [],
  } = relatedData || {};

  // Filter active academic years
  const activeAcademicYears = academicYears.filter((year: any) => year.status === "ACTIVE");
  const activeSubjects = subjects.filter((subject: any) => subject.status === "ACTIVE");

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new timetable" : "Update the timetable"}
      </h1>

      {/* Step 1: Branch Selection */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium text-gray-800">Step 1: Select Branch</h3>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Branch</label>
          <select
            {...register("branchId", { valueAsNumber: true })}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue=""
          >
            <option value="">Choose a branch</option>
            {branches.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.shortName}
              </option>
            ))}
          </select>
          {errors.branchId?.message && (
            <p className="text-xs text-red-400">{errors.branchId.message.toString()}</p>
          )}
        </div>
      </div>

      {/* Step 2: Academic Year Selection */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium text-gray-800">Step 2: Select Academic Year</h3>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Academic Year</label>
          <select
            {...register("academicYearId", { valueAsNumber: true })}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue=""
          >
            <option value="">Choose an academic year</option>
            {activeAcademicYears.map((year: any) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
          {errors.academicYearId?.message && (
            <p className="text-xs text-red-400">{errors.academicYearId.message.toString()}</p>
          )}
        </div>
      </div>

      {/* Step 3: Class Selection */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium text-gray-800">Step 3: Select Class</h3>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Class</label>
          <select
            {...register("classId", { valueAsNumber: true })}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue=""
          >
            <option value="">Choose a class</option>
            {filteredClasses.map((cls: any) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">{errors.classId.message.toString()}</p>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs text-gray-400">Subject</label>
          <select
            {...register("subjectId", { valueAsNumber: true })}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue=""
          >
            <option value="">Choose a subject</option>
            {activeSubjects.map((subject: any) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjectId?.message && (
            <p className="text-xs text-red-400">{errors.subjectId.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs text-gray-400">Teacher</label>
          <select
            {...register("teacherId")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue=""
          >
            <option value="">Choose a teacher</option>
            {filteredTeachers.map((teacher: any) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.firstName} {teacher.lastName}
              </option>
            ))}
          </select>
          {errors.teacherId?.message && (
            <p className="text-xs text-red-400">{errors.teacherId.message.toString()}</p>
          )}
        </div>
      </div>

      {/* Date and Time Information */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="Date"
            name="fullDate"
            register={register}
            error={errors?.fullDate}
            type="date"
            inputProps={{
              min: activeAcademicYears.find((year: any) => year.id === watchAcademicYearId)?.startDate?.split('T')[0],
              max: activeAcademicYears.find((year: any) => year.id === watchAcademicYearId)?.endDate?.split('T')[0],
            }}
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs text-gray-400">Day of Week</label>
          <select
            {...register("day")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            disabled // Auto-set based on date
          >
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
            <option value="SATURDAY">Saturday</option>
            <option value="SUNDAY">Sunday</option>
          </select>
          {errors.day?.message && (
            <p className="text-xs text-red-400">{errors.day.message.toString()}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="Start Time"
            name="startTime"
            register={register}
            error={errors?.startTime}
            type="time"
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="End Time"
            name="endTime"
            register={register}
            error={errors?.endTime}
            type="time"
          />
        </div>
      </div>

      {/* Location Information */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="Room Number"
            name="roomNumber"
            register={register}
            error={errors?.roomNumber}
            inputProps={{ placeholder: "e.g., 101, A-205" }}
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="Building Name (Optional)"
            name="buildingName"
            register={register}
            error={errors?.buildingName}
            inputProps={{ placeholder: "e.g., Main Building, Science Block" }}
          />
        </div>
      </div>


      {/* Status */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400">Status</label>
        <select
          {...register("status")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        {errors.status?.message && (
          <p className="text-xs text-red-400">{errors.status.message.toString()}</p>
        )}
      </div>

      {data && (
        <InputField
          label="Id"
          name="id"
          register={register}
          error={errors?.id}
          hidden
        />
      )}

      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default TimetableForm;
