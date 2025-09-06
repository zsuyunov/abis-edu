"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnnouncementSchema, announcementSchema } from "@/lib/formValidationSchemas";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type AnnouncementFormProps = {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
};

const AnnouncementForm = ({ type, data, setOpen, relatedData }: AnnouncementFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
    defaultValues: data ? {
      ...data,
      date: data.date ? new Date(data.date).toISOString().slice(0, 16) : "",
    } : {
      targetAudience: "ALL_USERS",
      isAllBranches: true,
      branchIds: [],
      classIds: [],
      userIds: [],
      studentIds: [],
      teacherIds: [],
      parentIds: [],
    },
  });

  // Watch form values for conditional rendering
  const watchTargetAudience = watch("targetAudience");
  const watchIsAllBranches = watch("isAllBranches");

  const [state, formAction] = useFormState(
    type === "create" ? createAnnouncement : updateAnnouncement,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  const onSubmit = handleSubmit((data) => {
    console.log("Form data:", data);
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      toast(`Announcement ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { branches = [], classes = [], users = [], students = [], teachers = [], parents = [] } = relatedData || {};

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new announcement" : "Update the announcement"}
      </h1>

      {/* Basic Announcement Information */}
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-400">Title</label>
          <input
            type="text"
            {...register("title")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            placeholder="Announcement title"
          />
          {errors.title?.message && (
            <p className="text-xs text-red-400">{errors.title.message.toString()}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-400">Description</label>
        <textarea
          {...register("description")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          rows={4}
          placeholder="Announcement description"
        />
        {errors.description?.message && (
          <p className="text-xs text-red-400">{errors.description.message.toString()}</p>
        )}
      </div>

      {/* Date */}
      <div className="flex flex-col gap-2 w-full md:w-1/2">
        <label className="text-xs text-gray-400">Date</label>
        <input
          type="datetime-local"
          {...register("date")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
        />
        {errors.date?.message && (
          <p className="text-xs text-red-400">{errors.date.message.toString()}</p>
        )}
      </div>

      {/* Branch Selection (Required First Step) */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium text-gray-800">Step 1: Select Branch(es)</h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("isAllBranches")}
              className="rounded"
            />
            <span className="text-sm">All Branches</span>
          </label>

          {!watchIsAllBranches && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400">Select Specific Branches</label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2">
                {branches.map((branch: any) => (
                  <label key={branch.id} className="flex items-center gap-2 p-1">
                    <input
                      type="checkbox"
                      value={branch.id}
                      {...register("branchIds")}
                      className="rounded"
                    />
                    <span className="text-sm">{branch.shortName}</span>
                  </label>
                ))}
              </div>
              {errors.branchIds?.message && (
                <p className="text-xs text-red-400">{errors.branchIds.message.toString()}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Target Audience Selection (Second Step) */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium text-gray-800">Step 2: Select Audience Type</h3>
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-400">Target Audience</label>
          <select
            {...register("targetAudience")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          >
            <option value="ALL_USERS">All Users (in selected branch(es))</option>
            <option value="ALL_STUDENTS">All Students (in selected branch(es))</option>
            <option value="ALL_TEACHERS">All Teachers (in selected branch(es))</option>
            <option value="ALL_PARENTS">All Parents (in selected branch(es))</option>
            <option value="SPECIFIC_CLASSES">Specific Classes (in selected branch(es))</option>
            <option value="SPECIFIC_USERS">Specific Users (in selected branch(es))</option>
          </select>
          {errors.targetAudience?.message && (
            <p className="text-xs text-red-400">{errors.targetAudience.message.toString()}</p>
          )}
        </div>
      </div>

      {/* Step 3: Optional Class Filtering (for Students/Parents) */}
      {(watchTargetAudience === "ALL_STUDENTS" || watchTargetAudience === "ALL_PARENTS") && (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium text-gray-800">Step 3: Optional Class Filtering</h3>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Filter by Specific Classes (Optional)</label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2">
              {classes.map((cls: any) => (
                <label key={cls.id} className="flex items-center gap-2 p-1">
                  <input
                    type="checkbox"
                    value={cls.id}
                    {...register("classIds")}
                    className="rounded"
                  />
                  <span className="text-sm">{cls.name}</span>
                </label>
              ))}
            </div>
            {errors.classIds?.message && (
              <p className="text-xs text-red-400">{errors.classIds.message.toString()}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Specific User Selection */}
      {watchTargetAudience === "SPECIFIC_USERS" && (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium text-gray-800">Step 3: Select Specific Users</h3>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Select Users</label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2">
              {users.map((user: any) => (
                <label key={user.id} className="flex items-center gap-2 p-1">
                  <input
                    type="checkbox"
                    value={user.id}
                    {...register("userIds")}
                    className="rounded"
                  />
                  <span className="text-sm">{user.firstName} {user.lastName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Select Students</label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2">
              {students.map((student: any) => (
                <label key={student.id} className="flex items-center gap-2 p-1">
                  <input
                    type="checkbox"
                    value={student.id}
                    {...register("studentIds")}
                    className="rounded"
                  />
                  <span className="text-sm">{student.firstName} {student.lastName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Select Teachers</label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2">
              {teachers.map((teacher: any) => (
                <label key={teacher.id} className="flex items-center gap-2 p-1">
                  <input
                    type="checkbox"
                    value={teacher.id}
                    {...register("teacherIds")}
                    className="rounded"
                  />
                  <span className="text-sm">{teacher.firstName} {teacher.lastName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Select Parents</label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2">
              {parents.map((parent: any) => (
                <label key={parent.id} className="flex items-center gap-2 p-1">
                  <input
                    type="checkbox"
                    value={parent.id}
                    {...register("parentIds")}
                    className="rounded"
                  />
                  <span className="text-sm">{parent.firstName} {parent.lastName}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Specific Class Selection */}
      {watchTargetAudience === "SPECIFIC_CLASSES" && (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium text-gray-800">Step 3: Select Specific Classes</h3>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Select Classes</label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2">
              {classes.map((cls: any) => (
                <label key={cls.id} className="flex items-center gap-2 p-1">
                  <input
                    type="checkbox"
                    value={cls.id}
                    {...register("classIds")}
                    className="rounded"
                  />
                  <span className="text-sm">{cls.name}</span>
                </label>
              ))}
            </div>
            {errors.classIds?.message && (
              <p className="text-xs text-red-400">{errors.classIds.message.toString()}</p>
            )}
          </div>
        </div>
      )}

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}

      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default AnnouncementForm;
