"use client";

import FormModal from "./FormModal";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "parentAssign"
    | "subject"
    | "class"
    | "timetable"
    | "exam"
    | "assignment"
    | "homework"
    | "teacherAssignment"
    | "studentAssignment"
    | "result"
    | "attendance"
    | "grade"
    | "event"
    | "announcement"
    | "branch"
    | "user"
    | "academicYear"
    | "message";
  type:
    | "create"
    | "update"
    | "edit"
    | "view"
    | "delete"
    | "archive"
    | "restore"
    | "resetPassword"
    | "sendMessage"
    | "assign"
    | "unassign"
    | "transfer";
  data?: any;
  id?: number | string;
  currentUserId?: string;
};

const FormContainer = ({ table, type, data, id, currentUserId }: FormContainerProps) => {
  // Client component wrapper for opening the appropriate form modal.
  // Related data (branches, classes, etc.) should be fetched inside the form components themselves.
  const relatedData = {};

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
        currentUserId={currentUserId || ""}
      />
    </div>
  );
};

export default FormContainer;
