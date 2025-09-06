"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect } from "react";
import {
  archiveCommentSchema,
  ArchiveCommentSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { archiveBranch, restoreBranch, deleteBranch } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const BranchArchiveCommentForm = ({
  branchId,
  branchName,
  action,
  currentUserId,
  setOpen,
}: {
  branchId: number;
  branchName: string;
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
        return archiveBranch;
      case "RESTORE":
        return restoreBranch;
      case "DELETE":
        return deleteBranch;
      default:
        return archiveBranch;
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
    formData.append("branchId", branchId.toString());
    formData.append("comment", data.comment);
    formData.append("currentUserId", currentUserId);
    
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      const actionPastTense = action === "DELETE" ? "deleted" : action.toLowerCase() + "d";
      toast(`Branch ${branchName} has been ${actionPastTense}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, setOpen, branchName, action]);

  const getActionColor = () => {
    switch (action) {
      case "ARCHIVE":
        return "bg-orange-600 hover:bg-orange-700";
      case "RESTORE":
        return "bg-green-600 hover:bg-green-700";
      case "DELETE":
        return "bg-red-600 hover:bg-red-700";
      default:
        return "bg-gray-600 hover:bg-gray-700";
    }
  };

  const getPlaceholder = () => {
    switch (action) {
      case "ARCHIVE":
        return "Please explain why this branch is being archived (e.g., temporary closure, restructuring, etc.)";
      case "RESTORE":
        return "Please explain why this branch is being restored (e.g., reopening, resolved issues, etc.)";
      case "DELETE":
        return "Please explain why this branch is being deleted permanently (e.g., permanent closure, consolidation, etc.)";
      default:
        return "Please provide a reason for this action";
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {action === "ARCHIVE" && "Archive Branch"}
        {action === "RESTORE" && "Restore Branch"}
        {action === "DELETE" && "Delete Branch"}
      </h1>

      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="font-medium text-gray-800 mb-2">Branch Information</h3>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Name:</span> {branchName}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">ID:</span> {branchId}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">
          Reason for {action.toLowerCase()}ing this branch *
        </label>
        <textarea
          className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full min-h-[100px] resize-y"
          {...register("comment")}
          placeholder={getPlaceholder()}
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

      {action === "DELETE" && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-sm text-red-700">
            <strong>Warning:</strong> This action cannot be undone. Deleting a branch will permanently remove all branch data.
            Make sure there are no users assigned to this branch before deletion.
          </p>
        </div>
      )}

      {state.error && (
        <span className="text-red-500">
          Failed to {action.toLowerCase()} branch. Please try again.
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
          className={`flex-1 text-white p-2 rounded-md ${getActionColor()}`}
        >
          {action === "ARCHIVE" && "Archive Branch"}
          {action === "RESTORE" && "Restore Branch"}
          {action === "DELETE" && "Delete Branch"}
        </button>
      </div>
    </form>
  );
};

export default BranchArchiveCommentForm;
