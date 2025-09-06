"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect } from "react";
import {
  archiveCommentSchema,
  ArchiveCommentSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { archiveAcademicYear, restoreAcademicYear, deleteAcademicYear } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const AcademicYearArchiveCommentForm = ({
  academicYearId,
  academicYearName,
  action,
  currentUserId,
  setOpen,
}: {
  academicYearId: number;
  academicYearName: string;
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
        return archiveAcademicYear;
      case "RESTORE":
        return restoreAcademicYear;
      case "DELETE":
        return deleteAcademicYear;
      default:
        return archiveAcademicYear;
    }
  };

  const [state, formAction] = useFormState(getActionFunction(), {
    success: false,
    error: false,
  });

  const comment = watch("comment");

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    // Create the data object with required fields
    const actionData = {
      id: academicYearId,
      comment: data.comment,
      action: data.action,
      createdBy: currentUserId,
    };
    
    formAction(actionData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      const actionPastTense = action === "DELETE" ? "deleted" : action.toLowerCase() + "d";
      toast(`Academic year ${academicYearName} has been ${actionPastTense}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) {
      toast.error(`Failed to ${action.toLowerCase()} academic year. Please try again.`);
    }
  }, [state, router, setOpen, academicYearName, action]);

  const isArchive = action === "ARCHIVE";
  const isDelete = action === "DELETE";

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {action === "ARCHIVE" && "Archive Academic Year"}
        {action === "RESTORE" && "Restore Academic Year"}
        {action === "DELETE" && "Delete Academic Year"}
      </h1>
      
      <div className={`border-l-4 p-4 ${
        isArchive 
          ? "bg-red-50 border-red-400" 
          : isDelete
          ? "bg-red-50 border-red-400"
          : "bg-green-50 border-green-400"
      }`}>
        <div className="flex">
          <div className="ml-3">
            <p className={`text-sm ${
              isArchive ? "text-red-700" : isDelete ? "text-red-700" : "text-green-700"
            }`}>
              <strong>
                {action === "ARCHIVE" && "Warning:"}
                {action === "RESTORE" && "Confirmation:"}
                {action === "DELETE" && "Danger:"}
              </strong> 
              {action === "ARCHIVE" && ` You are about to archive academic year ${academicYearName}. This will set its status to inactive and prevent it from being used for new classes.`}
              {action === "RESTORE" && ` You are about to restore academic year ${academicYearName}. This will set its status to active and allow it to be used for classes again.`}
              {action === "DELETE" && ` You are about to permanently delete academic year ${academicYearName}. This will remove all academic year data including semesters and cannot be undone.`}
            </p>
            <p className={`text-xs mt-1 ${
              isArchive ? "text-red-600" : isDelete ? "text-red-600" : "text-green-600"
            }`}>
              A comment explaining the reason for this action is required.
            </p>
            {action === "DELETE" && (
              <p className="text-xs mt-1 text-red-600">
                <strong>Note:</strong> Cannot delete academic year if it&apos;s being used by classes.
              </p>
            )}
          </div>
        </div>
      </div>

      <input
        type="hidden"
        {...register("action")}
        value={action}
      />

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">
          Reason for {action === "DELETE" ? "deleting" : action.toLowerCase() + "ing"} this academic year *
        </label>
        <textarea
          className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full min-h-[100px] resize-y"
          {...register("comment")}
          placeholder={
            action === "ARCHIVE"
              ? "Please explain why this academic year is being archived (e.g., academic year ended, policy change, etc.)"
              : action === "RESTORE"
              ? "Please explain why this academic year is being restored (e.g., correction needed, year extended, etc.)"
              : "Please explain why this academic year is being deleted permanently (e.g., duplicate entry, data cleanup, etc.)"
          }
          maxLength={500}
        />
        {errors.comment?.message && (
          <p className="text-xs text-red-400">
            {errors.comment.message.toString()}
          </p>
        )}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Minimum 10 characters required
          </span>
          <span className="text-xs text-gray-500">
            {comment?.length || 0}/500 characters
          </span>
        </div>
      </div>

      {state.error && (
        <span className="text-red-500">
          Failed to {action === "DELETE" ? "delete" : action.toLowerCase()} academic year. Please try again.
        </span>
      )}
      
      <div className="flex gap-3">
        <button 
          type="button" 
          onClick={() => setOpen(false)}
          className="flex-1 bg-gray-400 text-white p-2 rounded-md hover:bg-gray-500"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className={`flex-1 text-white p-2 rounded-md ${
            isArchive 
              ? "bg-red-600 hover:bg-red-700" 
              : isDelete
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {action === "ARCHIVE" && "Archive Academic Year"}
          {action === "RESTORE" && "Restore Academic Year"}
          {action === "DELETE" && "Delete Academic Year"}
        </button>
      </div>
    </form>
  );
};

export default AcademicYearArchiveCommentForm;
