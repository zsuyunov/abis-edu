"use client";

import { useState } from "react";
import Image from "next/image";
import ArchiveCommentForm from "./forms/ArchiveCommentForm";
import StudentArchiveCommentForm from "./forms/StudentArchiveCommentForm";
import ClassArchiveCommentForm from "./forms/ClassArchiveCommentForm";

interface ArchiveRestoreButtonProps {
  table: "student" | "class" | "user";
  data: any;
  currentUserId?: string;
}

const ArchiveRestoreButton = ({ table, data, currentUserId }: ArchiveRestoreButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const isArchived = data.status === "INACTIVE" || data.status === "ARCHIVED" || data.archivedAt;
  const action = isArchived ? "RESTORE" : "ARCHIVE";
  const type = isArchived ? "restore" : "archive";

    const getButtonStyle = () => {
    return type === "archive"
      ? "w-7 h-7 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95"
      : "w-7 h-7 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95";
  };

  const getIcon = () => {
    return type === "archive" ? "/archive.png" : "/restore.png";
  };

  const getTitle = () => {
    return type === "archive" ? "Archive" : "Restore";
  };

  const renderForm = () => {
    switch (table) {
      case "student":
        return (
          <StudentArchiveCommentForm
            studentId={data.id}
            studentName={`${data.firstName} ${data.lastName}`}
            action={action}
            currentUserId={currentUserId || ""}
            setOpen={setOpen}
          />
        );
      case "class":
        return (
          <ClassArchiveCommentForm
            classId={data.id}
            className={data.name}
            action={action}
            currentUserId={currentUserId || ""}
            setOpen={setOpen}
          />
        );
      case "user":
        return (
          <ArchiveCommentForm
            userId={data.id}
            userName={`${data.firstName} ${data.lastName}`}
            action={action}
            currentUserId={currentUserId || ""}
            setOpen={setOpen}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <button
        className={getButtonStyle()}
        onClick={() => setOpen(true)}
        title={getTitle()}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        ) : (
          <Image src={getIcon()} alt="" width={16} height={16} />
        )}
      </button>
      
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            {renderForm()}
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

export default ArchiveRestoreButton;
