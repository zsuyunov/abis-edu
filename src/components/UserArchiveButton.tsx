"use client";

import { useState } from "react";
import ArchiveCommentForm from "./forms/ArchiveCommentForm";

const UserArchiveButton = ({
  type,
  data,
  currentUserId,
}: {
  type: "archive" | "restore";
  data?: any;
  currentUserId: string;
}) => {
  const [open, setOpen] = useState(false);

  const getButtonStyle = () => {
    switch (type) {
      case "archive":
        return "w-full p-2 bg-orange-400 text-white rounded-md hover:bg-orange-500";
      case "restore":
        return "w-full p-2 bg-green-400 text-white rounded-md hover:bg-green-500";
      default:
        return "w-full p-2 bg-gray-400 text-white rounded-md hover:bg-gray-500";
    }
  };

  return (
    <>
      <button
        className={getButtonStyle()}
        onClick={() => setOpen(true)}
      >
        {type === "archive" ? "Archive User" : "Restore User"}
      </button>
      
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <ArchiveCommentForm
              userId={data.id}
              userName={`${data.firstName} ${data.lastName}`}
              action={type.toUpperCase() as "ARCHIVE" | "RESTORE"}
              currentUserId={currentUserId}
              setOpen={setOpen}
            />
            <div
              className="absolute top-4 right-4 cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-full p-2 z-10"
              onClick={() => setOpen(false)}
            >
              <img src="/close.png" alt="Close" width={16} height={16} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserArchiveButton;
