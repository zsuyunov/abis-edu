"use client";

import { useState } from "react";
import PasswordResetForm from "./forms/PasswordResetForm";

const PasswordResetModal = ({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button 
        className="w-full p-2 bg-blue-400 text-white rounded-md hover:bg-blue-500"
        onClick={() => setOpen(true)}
      >
        Reset Password
      </button>
      
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <PasswordResetForm
              userId={userId}
              userName={userName}
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

export default PasswordResetModal;
