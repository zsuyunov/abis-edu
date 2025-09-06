"use client";

import {
  deleteBranch,
  deleteClass,
  deleteExam,
  deleteParent,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
  deleteTimetableSimple,
  deleteAttendanceSimple,
  deleteGradeSimple,
  deleteUser,
  deleteEvent,
  deleteAnnouncement,
  deleteTeacherAssignment,
  archiveClass,
  archiveTeacher,
  archiveStudent,
  archiveSubject,
  archiveExam,
  archiveBranch,
  archiveUser,
  archiveParent,
  // archiveEvent,
  // archiveAnnouncement,
  restoreClass,
  restoreTeacher,
  restoreStudent,
  restoreSubject,
  // restoreExam,
  restoreBranch,
  restoreUser,
  restoreParent,
  // restoreEvent,
  // restoreAnnouncement,
} from "@/lib/actions";
import { deleteStudentAssignment } from "@/lib/studentAssignmentActions";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";
import { unassignParent } from "@/lib/actions";

const deleteActionMap = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  exam: deleteExam,
  branch: deleteBranch,
  user: deleteUser,
  parent: deleteParent,
  event: deleteEvent,
  announcement: deleteAnnouncement,
  teacherAssignment: deleteTeacherAssignment,
  studentAssignment: deleteStudentAssignment,
// TODO: OTHER DELETE ACTIONS
  timetable: deleteTimetableSimple,
  attendance: deleteAttendanceSimple,
  grade: deleteGradeSimple,
  lesson: deleteSubject,
  assignment: deleteSubject,
  result: deleteSubject,
};

const archiveActionMap = {
  class: archiveClass,
  teacher: archiveTeacher,
  student: archiveStudent,
  subject: archiveSubject,
  exam: archiveExam,
  branch: archiveBranch,
  user: archiveUser,
  parent: archiveParent,
  // event: archiveEvent,
  // announcement: archiveAnnouncement,
};

const restoreActionMap = {
  class: restoreClass,
  teacher: restoreTeacher,
  student: restoreStudent,
  subject: restoreSubject,
  // exam: restoreExam,
  branch: restoreBranch,
  user: restoreUser,
  parent: restoreParent,
  // event: restoreEvent,
  // announcement: restoreAnnouncement,
};

// USE LAZY LOADING

// import TeacherForm from "./forms/TeacherForm";
// import StudentForm from "./forms/StudentForm";

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Loading...</h1>,
});
const TeacherAssignmentForm = dynamic(() => import("./forms/TeacherAssignmentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentAssignmentForm = dynamic(() => import("./forms/StudentAssignmentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentArchiveCommentForm = dynamic(() => import("./forms/StudentArchiveCommentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ClassArchiveCommentForm = dynamic(() => import("./forms/ClassArchiveCommentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ArchiveCommentForm = dynamic(() => import("./forms/ArchiveCommentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ExamForm = dynamic(() => import("./forms/ExamForm"), {
  loading: () => <h1>Loading...</h1>,
});
const BranchForm = dynamic(() => import("./forms/BranchForm"), {
  loading: () => <h1>Loading...</h1>,
});
const UserForm = dynamic(() => import("./forms/UserForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ParentForm = dynamic(() => import("./forms/ParentForm"), {
  loading: () => <h1>Loading...</h1>,
});

const ParentAssignForm = dynamic(() => import("./ParentAssignForm"), {
  loading: () => <h1>Loading...</h1>,
});
const PasswordResetForm = dynamic(() => import("./forms/PasswordResetForm"), {
  loading: () => <h1>Loading...</h1>,
});
const SendMessageModal = dynamic(() => import("./SendMessageModal"), {
  loading: () => <h1>Loading...</h1>,
});
const AcademicYearForm = dynamic(() => import("./forms/AcademicYearForm"), {
  loading: () => <h1>Loading...</h1>,
});
const EventForm = dynamic(() => import("./forms/EventForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AdminMessageForm = dynamic(() => import("./forms/AdminMessageForm"), {
  loading: () => <h1>Loading...</h1>,
});
const TimetableForm = dynamic(() => import("./forms/TimetableForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AttendanceForm = dynamic(() => import("./forms/AttendanceForm"), {
  loading: () => <h1>Loading...</h1>,
});
const GradeForm = dynamic(() => import("./forms/GradeForm"), {
  loading: () => <h1>Loading...</h1>,
});
// TODO: OTHER FORMS

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update" | "delete" | "archive" | "restore" | "assign",
    data?: any,
    relatedData?: any,
    currentUserId?: string
  ) => JSX.Element;
} = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  teacherAssignment: (setOpen, type, data, relatedData) => (
    <TeacherAssignmentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  studentAssignment: (setOpen, type, data, relatedData) => (
    <StudentAssignmentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  student: (setOpen, type, data, relatedData, currentUserId) => {
    if (type === "archive") {
      return (
        <StudentArchiveCommentForm
          studentId={data.id}
          studentName={`${data.firstName} ${data.lastName}`}
          action="ARCHIVE"
          currentUserId={currentUserId || ""}
          setOpen={setOpen}
        />
      );
    }
    if (type === "restore") {
      return (
        <StudentArchiveCommentForm
          studentId={data.id}
          studentName={`${data.firstName} ${data.lastName}`}
          action="RESTORE"
          currentUserId={currentUserId || ""}
          setOpen={setOpen}
        />
      );
    }
    if (type === "resetPassword") {
      return (
        <PasswordResetForm
          userId={data.id}
          userName={`${data.firstName} ${data.lastName}`}
          setOpen={setOpen}
        />
      );
    }
    if (type === "sendMessage") {
      return (
        <SendMessageModal
          receiverId={data.id}
          receiverName={`${data.firstName} ${data.lastName}`}
          senderId={currentUserId || ""}
        />
      );
    }
    if (type === "delete") {
      return (
        <StudentArchiveCommentForm
          studentId={data.id}
          studentName={`${data.firstName} ${data.lastName}`}
          action="DELETE"
          currentUserId={currentUserId || ""}
          setOpen={setOpen}
        />
      );
    }
    return (
      <StudentForm
        type={type}
        data={data}
        setOpen={setOpen}
        relatedData={relatedData}
      />
    );
  },
  exam: (setOpen, type, data, relatedData) => (
    <ExamForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  branch: (setOpen, type, data, relatedData) => (
    <BranchForm
      type={type}
      data={data}
      setOpen={setOpen}
    />
  ),
  user: (setOpen, type, data, relatedData, currentUserId) => {
    if (type === "archive") {
      return (
        <ArchiveCommentForm
          userId={data.id}
          userName={`${data.firstName} ${data.lastName}`}
          action="ARCHIVE"
          currentUserId={currentUserId || ""}
          setOpen={setOpen}
        />
      );
    }
    if (type === "restore") {
      return (
        <ArchiveCommentForm
          userId={data.id}
          userName={`${data.firstName} ${data.lastName}`}
          action="RESTORE"
          currentUserId={currentUserId || ""}
          setOpen={setOpen}
        />
      );
    }
    return (
      <UserForm
        type={type}
        data={data}
        setOpen={setOpen}
        relatedData={relatedData}
      />
    );
  },
  class: (setOpen, type, data, relatedData, currentUserId) => {
    if (type === "archive") {
      return (
        <ClassArchiveCommentForm
          classId={data.id}
          className={data.name}
          action="ARCHIVE"
          currentUserId={currentUserId || ""}
          setOpen={setOpen}
        />
      );
    }
    if (type === "restore") {
      return (
        <ClassArchiveCommentForm
          classId={data.id}
          className={data.name}
          action="RESTORE"
          currentUserId={currentUserId || ""}
          setOpen={setOpen}
        />
      );
    }
    if (type === "delete") {
      return (
        <ClassArchiveCommentForm
          classId={data.id}
          className={data.name}
          action="DELETE"
          currentUserId={currentUserId || ""}
          setOpen={setOpen}
        />
      );
    }
    return (
      <ClassForm
        type={type}
        data={data}
        setOpen={setOpen}
        relatedData={relatedData}
      />
    );
  },
  parent: (setOpen, type, data, relatedData) => (
    <ParentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  parentAssign: (setOpen, type, data, relatedData, currentUserId) => (
    <ParentAssignForm
      studentId={data?.studentId}
      studentName={data?.studentName || `${data?.firstName} ${data?.lastName}`}
      currentUserId={currentUserId || ""}
      setOpen={setOpen}
    />
  ),
  academicYear: (setOpen, type, data, relatedData) => (
    <AcademicYearForm
      type={type}
      data={data}
      setOpen={setOpen}
    />
  ),
  event: (setOpen, type, data, relatedData) => (
    <EventForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  announcement: (setOpen, type, data, relatedData) => (
    <AnnouncementForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  message: (setOpen, type, data, relatedData, currentUserId) => (
    <AdminMessageForm
      type={type as "create"}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
      currentUserId={currentUserId || ""}
    />
  ),
  timetable: (setOpen, type, data, relatedData) => (
    <TimetableForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  attendance: (setOpen, type, data, relatedData) => (
    <AttendanceForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  grade: (setOpen, type, data, relatedData) => (
    <GradeForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
  currentUserId,
}: FormContainerProps & { relatedData?: any; currentUserId?: string }) => {
  // For view, reset password, transfer, and restore: no background, just icon
  // For update, send, archive, delete: rounded white background
  const size = type === "create" && table !== "studentAssignment" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create" && table !== "studentAssignment"
      ? "bg-lamaYellow"
      : type === "create" && table === "studentAssignment"
      ? "bg-white rounded-full border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95"
      : type === "update"
      ? "bg-white rounded-full border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95"
      : type === "delete"
      ? "bg-white rounded-full border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95"
      : type === "archive"
      ? "bg-white rounded-full border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95"
      : type === "restore"
      ? "bg-white rounded-full border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95"
      : type === "transfer"
      ? "bg-white rounded-full border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95"
      : type === "resetPassword"
      ? "bg-white rounded-full border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95"
      : type === "sendMessage"
      ? "bg-white rounded-full border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95"
      : type === "assign"
      ? "bg-white rounded-full border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95"
      : type === "unassign"
      ? "bg-white rounded-full border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95"
      : "bg-gray-500";

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const Form = () => {
    const isAcademicYearDelete = table === "academicYear" && type === "delete";

    const actionForDelete = isAcademicYearDelete
      ? (() => ({ success: false, error: false }))
      : (deleteActionMap as Record<string, any>)[table];

    const [state, formAction] = useFormState(actionForDelete as any, {
      success: false,
      error: false,
    });

    const router = useRouter();

    useEffect(() => {
      if (state.success) {
        toast(`${table} has been deleted!`);
        setOpen(false);
        router.refresh();
      }
    }, [state, router]);

    // Academic years use specialized action modals only for delete
    if (isAcademicYearDelete) {
      return (
        <div className="p-4 text-center">
          <span className="text-gray-600">
            Academic years use specialized action modals for delete, archive, and restore operations.
          </span>
        </div>
      );
    }

    // Handle different form types
    if (type === "delete") {
      // Check if this table has a specialized delete form
      const renderer = (forms as any)[table];
      if (typeof renderer === "function") {
        return renderer(setOpen, type, data, relatedData, currentUserId);
      }
      
      // Default delete form for tables without specialized forms
      return (
        <form action={formAction} className="p-4 flex flex-col gap-4">
          <input type="hidden" name="id" value={data?.id || id} />
          <span className="text-center font-medium">
            All data will be lost. Are you sure you want to delete this {table}?
          </span>
          <button className="bg-red-700 text-white py-2 px-4 rounded-md border-none w-max self-center">
            Delete
          </button>
        </form>
      );
    }

    if (type === "unassign") {
      const isTeacherAssignment = table === 'teacherAssignment';
      const isParent = table === 'parent';
      
      let action;
      if (isParent) {
        action = unassignParent;
      } else {
        action = (deleteActionMap as any)[table];
      }
      
      const [state, formAction] = useFormState(action, { success: false, error: false, message: '' });
      const [isPending, startTransition] = useTransition();

      const router = useRouter();

      useEffect(() => {
        console.log("🔄 Unassign state changed:", state);
        if (state.success) {
          console.log("✅ Unassign success, showing toast:", state.message);
          toast.success(state.message || "Unassignment successful!");
          setOpen(false);
          router.refresh();
        }
        if (state.error) {
          console.log("❌ Unassign error, showing toast:", state.message);
          toast.error(state.message || "Unassignment failed.");
        }
      }, [state, router, setOpen]);

      const handleSubmit = async (formData: FormData) => {
        console.log("🚀 Unassign form submitted:", formData);
        console.log("🚀 Action being used:", action);
        formAction(formData);
      };

      return (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          formData.append("currentUserId", currentUserId || "");
          handleSubmit(formData);
        }} className="p-4 flex flex-col gap-4">
          {/* Hidden fields for different table types */}
          {isTeacherAssignment ? (
            <>
              <input type="hidden" name="teacherId" value={data?.teacher?.id || data?.teacherId || ""} />
              <input type="hidden" name="classId" value={data?.class?.id || data?.classId || ""} />
              <input type="hidden" name="subjectId" value={data?.subject?.id || data?.subjectId || ""} />
              <input type="hidden" name="branchId" value={data?.branch?.id || data?.branchId || data?.class?.branch?.id || ""} />
            </>
          ) : isParent ? (
            <>
              <input type="hidden" name="parentId" value={data?.id || data?.parentId || ""} />
            </>
          ) : table === "studentAssignment" ? (
            <>
              <input type="hidden" name="studentId" value={data?.studentId || data?.student?.id || data?.id || ""} />
              <input type="hidden" name="academicYearId" value={data?.academicYearId || data?.academicYear?.id || ""} />
            </>
          ) : null}
          
          <span className="text-center font-medium">
            Are you sure you want to unassign this {table}?
          </span>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">
              Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              name="comment"
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              rows={3}
              placeholder="Please provide a reason for unassignment..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-orange-600 text-white py-2 px-4 rounded-md border-none w-max self-center disabled:opacity-50"
          >
            {isPending ? "Unassigning..." : "Confirm Unassignment"}
          </button>
        </form>
      );
    }

    if (type === "create" || type === "update") {
      const renderer = (forms as any)[table];
      if (typeof renderer === "function") {
        return renderer(setOpen, type, data, relatedData, currentUserId);
      }
      return (
        <div className="p-6 text-center text-sm text-gray-600">
          Form for &quot;{table}&quot; is not available yet.
        </div>
      );
    }

    if (type === "archive" || type === "restore") {
      // Check if this table has a specialized archive/restore form
      const renderer = (forms as any)[table];
      if (typeof renderer === "function") {
        return renderer(setOpen, type, data, relatedData, currentUserId);
      }
      
      // Default archive/restore form for tables without specialized forms
      return (
        <form className="p-4 flex flex-col gap-4">
          <span className="text-center font-medium">
            Are you sure you want to {type} this {table}?
          </span>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">
              Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              name="comment"
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              rows={3}
              placeholder={`Please provide a reason for ${type}...`}
              required
            />
          </div>
          <button className={`py-2 px-4 rounded-md border-none w-max self-center text-white ${
            type === "archive" ? "bg-orange-600" : "bg-green-600"
          }`}>
            {type === "archive" ? "Archive" : "Restore"}
          </button>
        </form>
      );
    }

    if (type === "resetPassword") {
      const renderer = (forms as any)[table];
      if (typeof renderer === "function") {
        return renderer(setOpen, type, data, relatedData, currentUserId);
      }
      
      return (
        <form className="p-4 flex flex-col gap-4">
          <span className="text-center font-medium">
            Reset password for {data?.firstName} {data?.lastName}?
          </span>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="newPassword"
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              placeholder="Enter new password"
              required
            />
          </div>
          <button className="bg-blue-600 text-white py-2 px-4 rounded-md border-none w-max self-center">
            Reset Password
          </button>
        </form>
      );
    }

    if (type === "sendMessage") {
      const renderer = (forms as any)[table];
      if (typeof renderer === "function") {
        return renderer(setOpen, type, data, relatedData, currentUserId);
      }
      
      return (
        <form className="p-4 flex flex-col gap-4">
          <span className="text-center font-medium">
            Send message to {data?.firstName} {data?.lastName}
          </span>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              placeholder="Message subject"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              rows={4}
              placeholder="Type your message here..."
              required
            />
          </div>
          <button className="bg-purple-600 text-white py-2 px-4 rounded-md border-none w-max self-center">
            Send Message
          </button>
        </form>
      );
    }

    if (type === "assign") {
      const renderer = (forms as any)[table];
      if (typeof renderer === "function") {
        return renderer(setOpen, type, data, relatedData, currentUserId);
      }
      return (
        <div className="p-6 text-center text-sm text-gray-600">
          Form for &quot;{table}&quot; is not available yet.
        </div>
      );
    }

    
    return <div>Form not found!</div>;
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        ) : (
          <Image src={
            type === "create" && table === "parent"
            ? "/father-and-son.png"
            : type === "assign" && table === "parentAssign"
            ? "/father-and-son.png"
            : type === "create" && table === "studentAssignment"
              ? "/assign.png"
              : type === "create" 
              ? "/create.png"
              : type === "update"
              ? "/update.png"
              : type === "delete"
              ? "/delete.png"
              : type === "archive"
              ? "/archive.png"
              : type === "restore"
              ? "/restore.png"
              : type === "transfer"
              ? "/transfer.png"
              : type === "resetPassword"
              ? "/reset_pass.png"
              : type === "sendMessage"
              ? "/send.png"
              : type === "assign"
              ? "/assign.png"
              : type === "unassign"
              ? "/delete.png"
              : "/default.png"
          } alt="" width={16} height={16} />
        )}
      </button>
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-full p-2 z-10"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={16} height={16} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
