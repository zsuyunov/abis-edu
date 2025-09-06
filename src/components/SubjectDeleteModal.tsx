"use client";

import { useState } from "react";
import Image from "next/image";
import SubjectArchiveCommentForm from "./forms/SubjectArchiveCommentForm";

const SubjectDeleteModal = ({
  data,
  currentUserId,
}: {
  data?: any;
  currentUserId: string;
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <button
        className="w-7 h-7 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95"
        onClick={() => setOpen(true)}
        title="Delete Subject"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        ) : (
          <Image src="/delete.png" alt="" width={16} height={16} />
        )}
      </button>
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
            <SubjectArchiveCommentForm
              subjectId={data.id}
              subjectName={data.name}
              action="DELETE"
              currentUserId={currentUserId}
              setOpen={setOpen}
            />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubjectDeleteModal;
