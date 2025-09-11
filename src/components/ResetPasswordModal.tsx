"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { z } from "zod";
import { resetParentPassword } from "@/lib/actions";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters long!" }),
});

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

const ResetPasswordModal = ({
  parentId,
  parentName,
  currentUserId,
}: {
  parentId: string;
  parentName: string;
  currentUserId: string;
}) => {
  const [open, setOpen] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const [state, formAction] = useFormState(resetParentPassword as any, {
    success: false,
    error: false,
    message: '',
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || `Password reset for ${parentName}!`);
      setOpen(false);
      reset();
      router.refresh();
    }
    if (state.error && state.message) {
      toast.error(state.message);
    }
  }, [state, router, parentName, reset]);

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    formData.append("parentId", parentId);
    formData.append("newPassword", data.newPassword);
    formData.append("currentUserId", currentUserId);
    formAction();
  });

  return (
    <>
      <button 
        className="w-full p-2 bg-orange-400 text-white rounded-md hover:bg-orange-500"
        onClick={() => setOpen(true)}
      >
        Reset Password
      </button>
      
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <form className="flex flex-col gap-6" onSubmit={onSubmit}>
              <h1 className="text-xl font-semibold">Reset Password</h1>
              
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                <p className="text-sm text-orange-700">
                  <strong>For:</strong> {parentName}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  {...register("newPassword")}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                  placeholder="Enter new password"
                />
                {errors.newPassword?.message && (
                  <p className="text-xs text-red-400">
                    {errors.newPassword.message.toString()}
                  </p>
                )}
              </div>

              {state.error && !state.message && (
                <span className="text-red-500">Failed to reset password. Please try again.</span>
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
                  className="flex-1 bg-orange-600 text-white p-2 rounded-md hover:bg-orange-700"
                >
                  Reset Password
                </button>
              </div>
            </form>
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

export default ResetPasswordModal;
