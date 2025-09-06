"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import InputField from "../InputField";
import { archiveCommentSchema, ArchiveCommentSchema } from "@/lib/formValidationSchemas";
import { archiveTimetable, restoreTimetable, deleteTimetable } from "@/lib/actions";
import { useRouter } from "next/navigation";

const TimetableArchiveCommentForm = ({
  action,
  timetableId,
  currentUserId,
  onClose,
}: {
  action: "archive" | "restore" | "delete";
  timetableId: string;
  currentUserId: string;
  onClose: () => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArchiveCommentSchema>({
    resolver: zodResolver(archiveCommentSchema),
  });

  const router = useRouter();

  const onSubmit = handleSubmit(async (data) => {
    let result;
    
    switch (action) {
      case "archive":
        result = await archiveTimetable(timetableId, data.comment, currentUserId);
        break;
      case "restore":
        result = await restoreTimetable(timetableId, data.comment, currentUserId);
        break;
      case "delete":
        result = await deleteTimetable(timetableId, data.comment, currentUserId);
        break;
    }

    if (result.success) {
      toast.success(`Timetable ${action}d successfully!`);
      onClose();
      router.refresh();
    } else {
      toast.error(`Failed to ${action} timetable!`);
    }
  });

  const actionText = {
    archive: { title: "Archive Timetable", action: "archive", color: "orange" },
    restore: { title: "Restore Timetable", action: "restore", color: "green" },
    delete: { title: "Delete Timetable", action: "delete", color: "red" },
  };

  const currentAction = actionText[action];

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{currentAction.title}</h1>
      
      <p className="text-sm text-gray-600">
        {action === "archive" && "Archiving will make this timetable inactive. You can restore it later if needed."}
        {action === "restore" && "Restoring will make this timetable active again."}
        {action === "delete" && "Deleting will permanently remove this timetable. This action cannot be undone."}
      </p>

      <InputField
        label="Comment (required)"
        name="comment"
        register={register}
        error={errors?.comment}
        inputProps={{
          placeholder: `Please provide a reason for ${action}ing this timetable...`,
          minLength: 10,
        }}
      />

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-4 py-2 text-white rounded-md ${
            currentAction.color === "orange"
              ? "bg-orange-500 hover:bg-orange-600"
              : currentAction.color === "green"
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {currentAction.title}
        </button>
      </div>
    </form>
  );
};

export default TimetableArchiveCommentForm;
