"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";

// Dynamically import the form to avoid hydration issues
const TimetableArchiveCommentForm = dynamic(() => import("./forms/TimetableArchiveCommentForm"), {
  loading: () => <p>Loading...</p>,
});

const TimetableActionModal = ({
  table,
  id,
  currentUserId,
}: {
  table: "archive" | "restore" | "delete";
  id: string;
  currentUserId: string;
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getActionConfig = () => {
    switch (table) {
      case "archive":
        return {
          icon: "/archive.png",
          alt: "archive",
          title: "Archive",
          bgColor: "bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95",
          textColor: "",
        };
      case "restore":
        return {
          icon: "/restore.png",
          alt: "restore", 
          title: "Restore",
          bgColor: "bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95",
          textColor: "",
        };
      case "delete":
        return {
          icon: "/delete.png",
          alt: "delete",
          title: "Delete",
          bgColor: "bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95", 
          textColor: "",
        };
    }
  };

  const config = getActionConfig();

  const size = 16;

  return (
    <>
      <button
        className={`${config.bgColor} ${config.textColor} rounded-full p-2`}
        onClick={() => setOpen(true)}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        ) : (
          <Image src={config.icon} alt={config.alt} width={size} height={size} />
        )}
      </button>
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-90 max-w-[90%]">
            <TimetableArchiveCommentForm
              action={table}
              timetableId={id}
              currentUserId={currentUserId}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TimetableActionModal;
