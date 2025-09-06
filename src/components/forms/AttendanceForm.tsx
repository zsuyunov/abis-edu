"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import InputField from "../InputField";
import { attendanceSchema, AttendanceSchema } from "@/lib/formValidationSchemas";
import { createAttendance, updateAttendance } from "@/lib/actions";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";

const AttendanceForm = ({
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
  } = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: data
      ? {
          ...data,
          date: new Date(data.date),
        }
      : undefined,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAttendance : updateAttendance,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  // Watch form values for dynamic filtering
  const watchTimetableId = watch("timetableId");

  // State for filtered data
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);

  useEffect(() => {
    if (state.success) {
      toast.success(`Attendance ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  useEffect(() => {
    if (state.error) {
      toast.error(`Failed to ${type} attendance!`);
    }
  }, [state, type]);

  // Filter students based on selected timetable's class
  useEffect(() => {
    if (watchTimetableId && relatedData?.students) {
      // Find the selected timetable to get its class
      const selectedTimetable = relatedData.timetables?.find(
        (t: any) => t.id === parseInt(watchTimetableId.toString())
      );
      
      if (selectedTimetable) {
        const filtered = relatedData.students.filter(
          (student: any) =>
            student.classId === selectedTimetable.classId &&
            student.status === "ACTIVE"
        );
        setFilteredStudents(filtered);
      } else {
        setFilteredStudents([]);
      }
    } else {
      setFilteredStudents([]);
    }
  }, [watchTimetableId, relatedData?.students, relatedData?.timetables]);

  const onSubmit = handleSubmit((formData) => {
    const formDataObj = new FormData();
    
    // Add all form data
    Object.keys(formData).forEach((key) => {
      const value = formData[key as keyof AttendanceSchema];
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
    timetables = [],
    students = [],
  } = relatedData || {};

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Record attendance" : "Update attendance"}
      </h1>

      {/* Timetable Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400">Timetable Session</label>
        <select
          {...register("timetableId", { valueAsNumber: true })}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          defaultValue=""
        >
          <option value="">Choose a timetable session</option>
          {timetables.map((timetable: any) => (
            <option key={timetable.id} value={timetable.id}>
              {timetable.subject?.name} - {timetable.class?.name} - {
                new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(timetable.fullDate))
              }
            </option>
          ))}
        </select>
        {errors.timetableId?.message && (
          <p className="text-xs text-red-400">{errors.timetableId.message.toString()}</p>
        )}
      </div>

      {/* Student Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400">Student</label>
        <select
          {...register("studentId")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          defaultValue=""
        >
          <option value="">Choose a student</option>
          {filteredStudents.map((student: any) => (
            <option key={student.id} value={student.id}>
              {student.firstName} {student.lastName} ({student.studentId})
            </option>
          ))}
        </select>
        {errors.studentId?.message && (
          <p className="text-xs text-red-400">{errors.studentId.message.toString()}</p>
        )}
      </div>

      {/* Date and Status */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="Date"
            name="date"
            register={register}
            error={errors?.date}
            type="date"
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs text-gray-400">Attendance Status</label>
          <select
            {...register("status")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          >
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="EXCUSED">Excused</option>
          </select>
          {errors.status?.message && (
            <p className="text-xs text-red-400">{errors.status.message.toString()}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <InputField
          label="Notes (Optional)"
          name="notes"
          register={register}
          error={errors?.notes}
          inputProps={{ 
            placeholder: "Add any notes about this attendance record...",
            maxLength: 500,
          }}
        />
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
        {type === "create" ? "Record Attendance" : "Update Attendance"}
      </button>
    </form>
  );
};

export default AttendanceForm;
