"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect } from "react";
import {
  archiveCommentSchema,
  ArchiveCommentSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { archiveStudent, restoreStudent, deleteStudent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const StudentArchiveCommentForm = ({
  studentId,
  studentName,
  action,
  currentUserId,
  setOpen,
}: {
  studentId: string;
  studentName: string;
  action: "ARCHIVE" | "RESTORE" | "DELETE";
  currentUserId: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ArchiveCommentSchema>({
    resolver: zodResolver(archiveCommentSchema),
    defaultValues: {
      action: action,
    },
  });

  const getActionFunction = () => {
    switch (action) {
      case "ARCHIVE":
        return archiveStudent;
      case "RESTORE":
        return restoreStudent;
      case "DELETE":
        return deleteStudent;
      default:
        return archiveStudent;
    }
  };

  const [state, formAction] = useFormState(getActionFunction(), {
    success: false,
    error: false,
  });

  const comment = watch("comment");

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    // Create FormData with the required fields
    const formData = new FormData();
    formData.append("studentId", studentId);
    formData.append("comment", data.comment);
    formData.append("createdBy", currentUserId);
    
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      const actionPastTense = action === "DELETE" ? "deleted" : action.toLowerCase() + "d";
      toast(`Student ${studentName} has been ${actionPastTense}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, setOpen, studentName, action]);

  const isArchive = action === "ARCHIVE";
  const isDelete = action === "DELETE";

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {action === "ARCHIVE" && "Archive Student"}
        {action === "RESTORE" && "Restore Student"}
        {action === "DELETE" && "Delete Student"}
      </h1>
      
      <div className={`border-l-4 p-4 ${
        isArchive 
          ? "bg-red-50 border-red-400" 
          : isDelete
          ? "bg-red-50 border-red-400"
          : "bg-green-50 border-green-400"
      }`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {isArchive || isDelete ? (
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${
              isArchive || isDelete ? "text-red-800" : "text-green-800"
            }`}>
              {action === "ARCHIVE" && "Archive Student"}
              {action === "RESTORE" && "Restore Student"}
              {action === "DELETE" && "Delete Student"}
            </h3>
            <div className={`mt-2 text-sm ${
              isArchive || isDelete ? "text-red-700" : "text-green-700"
            }`}>
              {action === "ARCHIVE" && "This will make the student inactive and hide them from active lists."}
              {action === "RESTORE" && "This will make the student active again and show them in active lists."}
              {action === "DELETE" && "This action cannot be undone. The student and all related data will be permanently removed."}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Comment <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("comment")}
          rows={4}
          className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400 resize-none"
          placeholder={`Please provide a reason for ${action.toLowerCase()}ing this student (minimum 10 characters)...`}
        />
        {errors?.comment?.message && (
          <p className="text-xs text-red-400">{errors.comment.message.toString()}</p>
        )}
        <p className="text-xs text-gray-500">
          Minimum 10 characters required. This comment will be recorded for audit purposes.
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lamaSky"
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lamaSky ${
            isArchive || isDelete
              ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
              : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
          }`}
        >
          {action === "ARCHIVE" && "Archive Student"}
          {action === "RESTORE" && "Restore Student"}
          {action === "DELETE" && "Delete Student"}
        </button>
      </div>
    </form>
  );
};

export default StudentArchiveCommentForm;
