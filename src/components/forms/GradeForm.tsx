"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import InputField from "../InputField";
import { gradeSchema, GradeSchema } from "@/lib/formValidationSchemas";
import { createGrade, updateGrade } from "@/lib/actions";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";

const GradeForm = ({
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
  } = useForm<GradeSchema>({
    resolver: zodResolver(gradeSchema),
    defaultValues: data
      ? {
          ...data,
          date: new Date(data.date),
        }
      : {
          maxValue: 100,
          status: "ACTIVE",
          year: new Date().getFullYear(),
        },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createGrade : updateGrade,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  // Watch form values for dynamic filtering
  const watchBranchId = watch("branchId");
  const watchAcademicYearId = watch("academicYearId");
  const watchClassId = watch("classId");
  const watchSubjectId = watch("subjectId");

  // State for filtered data
  const [filteredAcademicYears, setFilteredAcademicYears] = useState<any[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [filteredTimetables, setFilteredTimetables] = useState<any[]>([]);

  useEffect(() => {
    if (state.success) {
      toast.success(`Grade ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  useEffect(() => {
    if (state.error) {
      toast.error(`Failed to ${type} grade!`);
    }
  }, [state, type]);

  // Filter academic years based on branch
  useEffect(() => {
    if (watchBranchId && relatedData?.academicYears) {
      const filtered = relatedData.academicYears.filter((year: any) => year.status === "ACTIVE");
      setFilteredAcademicYears(filtered);
    } else {
      setFilteredAcademicYears([]);
    }
  }, [watchBranchId, relatedData?.academicYears]);

  // Filter classes based on branch and academic year
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

  // Filter subjects and teachers based on class
  useEffect(() => {
    if (watchClassId && relatedData?.subjects) {
      const filtered = relatedData.subjects.filter((subject: any) => subject.status === "ACTIVE");
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects([]);
    }

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
  }, [watchClassId, watchBranchId, relatedData?.subjects, relatedData?.teachers]);

  // Filter students based on class
  useEffect(() => {
    if (watchClassId && relatedData?.students) {
      const filtered = relatedData.students.filter(
        (student: any) =>
          student.classId === parseInt(watchClassId.toString()) &&
          student.status === "ACTIVE"
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  }, [watchClassId, relatedData?.students]);

  // Filter timetables based on class and subject
  useEffect(() => {
    if (watchClassId && watchSubjectId && relatedData?.timetables) {
      const filtered = relatedData.timetables.filter(
        (timetable: any) =>
          timetable.classId === parseInt(watchClassId.toString()) &&
          timetable.subjectId === parseInt(watchSubjectId.toString()) &&
          timetable.status === "ACTIVE"
      );
      setFilteredTimetables(filtered);
    } else {
      setFilteredTimetables([]);
    }
  }, [watchClassId, watchSubjectId, relatedData?.timetables]);

  const onSubmit = handleSubmit((formData) => {
    const formDataObj = new FormData();
    
    // Add all form data
    Object.keys(formData).forEach((key) => {
      const value = formData[key as keyof GradeSchema];
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
    classes = [],
    subjects = [],
    teachers = [],
    students = [],
    timetables = [],
  } = relatedData || {};

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Add new grade" : "Update grade"}
      </h1>

      {/* Branch Selection */}
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

      {/* Academic Year Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400">Academic Year</label>
        <select
          {...register("academicYearId", { valueAsNumber: true })}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          defaultValue=""
        >
          <option value="">Choose an academic year</option>
          {filteredAcademicYears.map((year: any) => (
            <option key={year.id} value={year.id}>
              {year.name}
            </option>
          ))}
        </select>
        {errors.academicYearId?.message && (
          <p className="text-xs text-red-400">{errors.academicYearId.message.toString()}</p>
        )}
      </div>

      {/* Class Selection */}
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

      {/* Subject and Student Selection */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs text-gray-400">Subject</label>
          <select
            {...register("subjectId", { valueAsNumber: true })}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue=""
          >
            <option value="">Choose a subject</option>
            {filteredSubjects.map((subject: any) => (
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
      </div>

      {/* Teacher Selection */}
      <div className="flex flex-col gap-2">
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

      {/* Grade Information */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="Grade Value"
            name="value"
            register={register}
            error={errors?.value}
            type="number"
            inputProps={{ 
              placeholder: "85, 4.2, etc.",
              step: "0.1",
              min: "0",
            }}
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="Max Value"
            name="maxValue"
            register={register}
            error={errors?.maxValue}
            type="number"
            inputProps={{ 
              placeholder: "100, 5.0, etc.",
              step: "0.1",
              min: "1",
            }}
          />
        </div>
      </div>

      {/* Grade Type and Date */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs text-gray-400">Grade Type</label>
          <select
            {...register("type")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="TERMLY">Termly</option>
            <option value="YEARLY">Yearly</option>
            <option value="EXAM_MIDTERM">Midterm Exam</option>
            <option value="EXAM_FINAL">Final Exam</option>
            <option value="EXAM_NATIONAL">National Exam</option>
          </select>
          {errors.type?.message && (
            <p className="text-xs text-red-400">{errors.type.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="Date"
            name="date"
            register={register}
            error={errors?.date}
            type="date"
          />
        </div>
      </div>

      {/* Optional Fields */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="Year"
            name="year"
            register={register}
            error={errors?.year}
            type="number"
            inputProps={{ 
              min: "2020",
              max: "2050",
            }}
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="Week (Optional)"
            name="week"
            register={register}
            error={errors?.week}
            type="number"
            inputProps={{ 
              min: "1",
              max: "53",
            }}
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="Month (Optional)"
            name="month"
            register={register}
            error={errors?.month}
            type="number"
            inputProps={{ 
              min: "1",
              max: "12",
            }}
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <InputField
            label="Term (Optional)"
            name="term"
            register={register}
            error={errors?.term}
            type="number"
            inputProps={{ 
              min: "1",
              max: "4",
            }}
          />
        </div>
      </div>

      {/* Optional Timetable Link */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400">Linked Timetable (Optional)</label>
        <select
          {...register("timetableId", { valueAsNumber: true })}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          defaultValue=""
        >
          <option value="">Choose a timetable session (optional)</option>
          {filteredTimetables.map((timetable: any) => (
            <option key={timetable.id} value={timetable.id}>
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(timetable.fullDate))} - Room {timetable.roomNumber}
            </option>
          ))}
        </select>
        {errors.timetableId?.message && (
          <p className="text-xs text-red-400">{errors.timetableId.message.toString()}</p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <InputField
          label="Description (Optional)"
          name="description"
          register={register}
          error={errors?.description}
          inputProps={{ 
            placeholder: "Add any notes about this grade...",
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
        {type === "create" ? "Add Grade" : "Update Grade"}
      </button>
    </form>
  );
};

export default GradeForm;
