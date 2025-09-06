"use client";

import { useFormState } from "react-dom";
import { archiveTeacher, restoreTeacher, deleteTeacher } from "@/lib/actions";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const TeacherArchiveCommentForm = ({
  teacherId,
  teacherName,
  action,
  currentUserId,
  setOpen,
}: {
  teacherId: string;
  teacherName: string;
  action: "ARCHIVE" | "RESTORE" | "DELETE";
  currentUserId: string;
  setOpen: (open: boolean) => void;
}) => {
  const [state, formAction] = useFormState(
    action === "ARCHIVE"
      ? archiveTeacher
      : action === "RESTORE"
      ? restoreTeacher
      : deleteTeacher,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      const actionPastTense = action === "DELETE" ? "deleted" : action.toLowerCase() + "d";
      toast(`Teacher ${teacherName} has been ${actionPastTense}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, teacherName, action, setOpen, router]);

  const isArchive = action === "ARCHIVE";
  const isDelete = action === "DELETE";

  return (
    <form action={formAction} className="p-4 flex flex-col gap-4">
      <span className="text-xl font-medium">
        {action === "ARCHIVE" && "Archive Teacher"}
        {action === "RESTORE" && "Restore Teacher"}
        {action === "DELETE" && "Delete Teacher"}
      </span>
      
      <p className={`text-sm ${
        isArchive ? "text-red-700" : isDelete ? "text-red-700" : "text-green-700"
      }`}>
        <strong>
          {action === "ARCHIVE" && "Warning:"}
          {action === "RESTORE" && "Confirmation:"}
          {action === "DELETE" && "Danger:"}
        </strong>
        {action === "ARCHIVE" && ` You are about to archive teacher ${teacherName}. This will set their status to inactive and prevent them from accessing the system.`}
        {action === "RESTORE" && ` You are about to restore teacher ${teacherName}. This will set their status to active and allow them to access the system again.`}
        {action === "DELETE" && ` You are about to permanently delete teacher ${teacherName}. This will remove all teacher data and cannot be undone.`}
      </p>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">
          Reason for {action === "DELETE" ? "deleting" : action.toLowerCase() + "ing"} this teacher *
        </label>
        <textarea
          name="comment"
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
          placeholder={`Please provide a reason for ${action.toLowerCase()}ing this teacher... (minimum 10 characters)`}
          rows={3}
          required
          minLength={10}
        />
      </div>

      <input type="hidden" name="teacherId" value={teacherId} />
      <input type="hidden" name="currentUserId" value={currentUserId} />

      {state.error && (
        <span className="text-red-500 text-sm">
          Something went wrong! Please make sure your comment is at least 10 characters long.
        </span>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="flex-1 bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600"
          onClick={() => setOpen(false)}
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
          {action === "ARCHIVE" && "Archive Teacher"}
          {action === "RESTORE" && "Restore Teacher"}
          {action === "DELETE" && "Delete Teacher"}
        </button>
      </div>
    </form>
  );
};

export default TeacherArchiveCommentForm;
