"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import InputField from "./InputField";
import { Calendar, Clock, Users, BookOpen, MapPin, Building, Repeat, Settings } from "lucide-react";

const timetableTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  branchId: z.number().min(1, "Branch is required"),
  classId: z.number().min(1, "Class is required"),
  academicYearId: z.number().min(1, "Academic year is required"),
  subjectId: z.number().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  days: z.array(z.string()).min(1, "At least one day must be selected"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  buildingName: z.string().optional(),
  recurrenceType: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  excludeDates: z.array(z.string()).optional()
});

type TimetableTemplateSchema = z.infer<typeof timetableTemplateSchema>;

const TimetableTemplateForm = ({
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
  } = useForm<TimetableTemplateSchema>({
    resolver: zodResolver(timetableTemplateSchema),
    defaultValues: data || {
      recurrenceType: "WEEKLY",
      days: [],
      excludeDates: []
    }
  });

  const [loading, setLoading] = useState(false);
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [excludeDateInput, setExcludeDateInput] = useState("");

  // Watch form values for dynamic filtering
  const watchBranchId = watch("branchId");
  const watchAcademicYearId = watch("academicYearId");
  const watchDays = watch("days");
  const watchExcludeDates = watch("excludeDates");

  useEffect(() => {
    if (watchBranchId && watchAcademicYearId && relatedData?.classes) {
      const filtered = relatedData.classes.filter(
        (cls: any) =>
          cls.branchId === watchBranchId &&
          cls.academicYearId === watchAcademicYearId &&
          cls.status === "ACTIVE"
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses([]);
    }
  }, [watchBranchId, watchAcademicYearId, relatedData?.classes]);

  useEffect(() => {
    if (watchBranchId && relatedData?.teachers) {
      const filtered = relatedData.teachers.filter(
        (teacher: any) =>
          teacher.branchId === watchBranchId &&
          teacher.status === "ACTIVE"
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers([]);
    }
  }, [watchBranchId, relatedData?.teachers]);

  const handleDayToggle = (day: string) => {
    const currentDays = watchDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    setValue("days", newDays);
  };

  const addExcludeDate = () => {
    if (excludeDateInput) {
      const currentDates = watchExcludeDates || [];
      if (!currentDates.includes(excludeDateInput)) {
        setValue("excludeDates", [...currentDates, excludeDateInput]);
      }
      setExcludeDateInput("");
    }
  };

  const removeExcludeDate = (dateToRemove: string) => {
    const currentDates = watchExcludeDates || [];
    setValue("excludeDates", currentDates.filter(date => date !== dateToRemove));
  };

  const onSubmit = async (formData: TimetableTemplateSchema) => {
    setLoading(true);
    try {
      const url = type === "create" 
        ? "/api/timetable-templates" 
        : "/api/timetable-templates";
      
      const method = type === "create" ? "POST" : "PUT";
      const body = type === "update" ? { ...formData, id: data?.id } : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(`Template ${type === "create" ? "created" : "updated"} successfully!`);
        setOpen(false);
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${type} template`);
      }
    } catch (error) {
      toast.error(`Failed to ${type} template`);
    } finally {
      setLoading(false);
    }
  };

  const {
    branches = [],
    academicYears = [],
    subjects = [],
  } = relatedData || {};

  const activeAcademicYears = academicYears.filter((year: any) => year.status === "ACTIVE");
  const activeSubjects = subjects.filter((subject: any) => subject.status === "ACTIVE");

  const daysOfWeek = [
    { value: "MONDAY", label: "Monday" },
    { value: "TUESDAY", label: "Tuesday" },
    { value: "WEDNESDAY", label: "Wednesday" },
    { value: "THURSDAY", label: "Thursday" },
    { value: "FRIDAY", label: "Friday" },
    { value: "SATURDAY", label: "Saturday" },
    { value: "SUNDAY", label: "Sunday" }
  ];

  return (
    <form className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Repeat className="w-5 h-5 text-blue-600" />
        </div>
        <h1 className="text-xl font-semibold">
          {type === "create" ? "Create Recurring Schedule Template" : "Update Template"}
        </h1>
      </div>

      {/* Template Name */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Template Name
        </label>
        <input
          {...register("name")}
          className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Physics - Grade 10 - Mon/Wed"
        />
        {errors.name?.message && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Branch</label>
          <select
            {...register("branchId", { valueAsNumber: true })}
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500"
          >
            <option value="">Choose a branch</option>
            {branches.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.shortName}
              </option>
            ))}
          </select>
          {errors.branchId?.message && (
            <p className="text-xs text-red-500">{errors.branchId.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Academic Year</label>
          <select
            {...register("academicYearId", { valueAsNumber: true })}
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500"
          >
            <option value="">Choose an academic year</option>
            {activeAcademicYears.map((year: any) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
          {errors.academicYearId?.message && (
            <p className="text-xs text-red-500">{errors.academicYearId.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Class
          </label>
          <select
            {...register("classId", { valueAsNumber: true })}
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500"
          >
            <option value="">Choose a class</option>
            {filteredClasses.map((cls: any) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-500">{errors.classId.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Subject
          </label>
          <select
            {...register("subjectId", { valueAsNumber: true })}
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500"
          >
            <option value="">Choose a subject</option>
            {activeSubjects.map((subject: any) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjectId?.message && (
            <p className="text-xs text-red-500">{errors.subjectId.message}</p>
          )}
        </div>
      </div>

      {/* Teacher Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Teacher</label>
        <select
          {...register("teacherId")}
          className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500"
        >
          <option value="">Choose a teacher</option>
          {filteredTeachers.map((teacher: any) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.firstName} {teacher.lastName}
            </option>
          ))}
        </select>
        {errors.teacherId?.message && (
          <p className="text-xs text-red-500">{errors.teacherId.message}</p>
        )}
      </div>

      {/* Days Selection */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Days of Week
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {daysOfWeek.map((day) => (
            <label
              key={day.value}
              className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                watchDays?.includes(day.value)
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={watchDays?.includes(day.value) || false}
                onChange={() => handleDayToggle(day.value)}
              />
              <span className="text-sm font-medium">{day.label}</span>
            </label>
          ))}
        </div>
        {errors.days?.message && (
          <p className="text-xs text-red-500">{errors.days.message}</p>
        )}
      </div>

      {/* Time and Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Start Time
          </label>
          <input
            {...register("startTime")}
            type="time"
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500"
          />
          {errors.startTime?.message && (
            <p className="text-xs text-red-500">{errors.startTime.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            End Time
          </label>
          <input
            {...register("endTime")}
            type="time"
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500"
          />
          {errors.endTime?.message && (
            <p className="text-xs text-red-500">{errors.endTime.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Room Number
          </label>
          <input
            {...register("roomNumber")}
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500"
            placeholder="e.g., 204, Lab-1"
          />
          {errors.roomNumber?.message && (
            <p className="text-xs text-red-500">{errors.roomNumber.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Building className="w-4 h-4" />
            Building Name (Optional)
          </label>
          <input
            {...register("buildingName")}
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500"
            placeholder="e.g., Science Block"
          />
        </div>
      </div>

      {/* Recurrence Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            Recurrence Type
          </label>
          <select
            {...register("recurrenceType")}
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500"
          >
            <option value="WEEKLY">Weekly</option>
            <option value="BIWEEKLY">Bi-weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Start Date</label>
          <input
            {...register("startDate")}
            type="date"
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500"
          />
          {errors.startDate?.message && (
            <p className="text-xs text-red-500">{errors.startDate.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">End Date</label>
          <input
            {...register("endDate")}
            type="date"
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500"
          />
          {errors.endDate?.message && (
            <p className="text-xs text-red-500">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* Exclude Dates */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Exclude Dates (Holidays, etc.)</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={excludeDateInput}
            onChange={(e) => setExcludeDateInput(e.target.value)}
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm flex-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addExcludeDate}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Add
          </button>
        </div>
        {watchExcludeDates && watchExcludeDates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {watchExcludeDates.map((date, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
              >
                {new Date(date).toLocaleDateString()}
                <button
                  type="button"
                  onClick={() => removeExcludeDate(date)}
                  className="ml-1 hover:text-red-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </>
        ) : (
          <>
            {type === "create" ? "Create Template" : "Update Template"}
          </>
        )}
      </button>
    </form>
  );
};

export default TimetableTemplateForm;
