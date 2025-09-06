"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect } from "react";
import {
  archiveCommentSchema,
  ArchiveCommentSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { archiveUser, restoreUser, deleteUser } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const ArchiveCommentForm = ({
  userId,
  userName,
  action,
  currentUserId,
  setOpen,
}: {
  userId: string;
  userName: string;
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
        return archiveUser;
      case "RESTORE":
        return restoreUser;
      case "DELETE":
        return deleteUser;
      default:
        return archiveUser;
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
    formData.append("userId", userId);
    formData.append("comment", data.comment);
    formData.append("currentUserId", currentUserId);
    
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      const actionPastTense = action === "DELETE" ? "deleted" : action.toLowerCase() + "d";
      toast(`User ${userName} has been ${actionPastTense}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, setOpen, userName, action]);

  const isArchive = action === "ARCHIVE";
  const isDelete = action === "DELETE";

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {action === "ARCHIVE" && "Archive User"}
        {action === "RESTORE" && "Restore User"}
        {action === "DELETE" && "Delete User"}
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
              {action === "ARCHIVE" && ` You are about to archive user ${userName}. This will set their status to inactive and prevent them from accessing the system.`}
              {action === "RESTORE" && ` You are about to restore user ${userName}. This will set their status to active and allow them to access the system again.`}
              {action === "DELETE" && ` You are about to permanently delete user ${userName}. This will remove all user data and cannot be undone.`}
            </p>
            <p className={`text-xs mt-1 ${
              isArchive ? "text-red-600" : isDelete ? "text-red-600" : "text-green-600"
            }`}>
              A comment explaining the reason for this action is required.
            </p>
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
          Reason for {action === "DELETE" ? "deleting" : action.toLowerCase() + "ing"} this user *
        </label>
        <textarea
          className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full min-h-[100px] resize-y"
          {...register("comment")}
          placeholder={
            action === "ARCHIVE"
              ? "Please explain why this user is being archived (e.g., end of employment, policy violation, etc.)"
              : action === "RESTORE"
              ? "Please explain why this user is being restored (e.g., return from leave, resolved issues, etc.)"
              : "Please explain why this user is being deleted permanently (e.g., duplicate account, data cleanup, etc.)"
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
          Failed to {action === "DELETE" ? "delete" : action.toLowerCase()} user. Please try again.
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
          {action === "ARCHIVE" && "Archive User"}
          {action === "RESTORE" && "Restore User"}
          {action === "DELETE" && "Delete User"}
        </button>
      </div>
    </form>
  );
};

export default ArchiveCommentForm;
