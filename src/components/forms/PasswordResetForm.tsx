"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import PasswordField from "../PasswordField";
import { Dispatch, SetStateAction, useEffect } from "react";
import {
  passwordResetSchema,
  PasswordResetSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { resetUserPassword } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const PasswordResetForm = ({
  userId,
  userName,
  setOpen,
}: {
  userId: string;
  userName: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PasswordResetSchema>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      userId: userId,
    },
  });

  const [state, formAction] = useFormState(resetUserPassword, {
    success: false,
    error: false,
  });

  const newPassword = watch("newPassword");

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Password has been reset for ${userName}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, setOpen, userName]);

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Reset Password</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Warning:</strong> Resetting the password for user <strong>{userName}</strong> will 
              immediately change their login credentials. Make sure to communicate the new password securely.
            </p>
          </div>
        </div>
      </div>

      <InputField
        label="User ID"
        name="userId"
        defaultValue={userId}
        register={register}
        error={errors?.userId}
        hidden
      />

      <PasswordField
        label="New Password"
        name="newPassword"
        register={register}
        error={errors?.newPassword}
        inputProps={{ 
          placeholder: "Enter new password (min 8 characters)",
          autoComplete: "new-password"
        }}
      />

      <PasswordField
        label="Confirm New Password"
        name="confirmPassword"
        register={register}
        error={errors?.confirmPassword}
        inputProps={{ 
          placeholder: "Confirm the new password",
          autoComplete: "new-password"
        }}
      />

      {/* Password strength indicator */}
      {newPassword && (
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Password Strength:</label>
          <div className="space-y-1">
            <div className={`text-xs ${newPassword.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
              ✓ At least 8 characters {newPassword.length >= 8 ? '✓' : '✗'}
            </div>
            <div className={`text-xs ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
              ✓ Contains uppercase letter {/[A-Z]/.test(newPassword) ? '✓' : '○'}
            </div>
            <div className={`text-xs ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
              ✓ Contains lowercase letter {/[a-z]/.test(newPassword) ? '✓' : '○'}
            </div>
            <div className={`text-xs ${/\d/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
              ✓ Contains number {/\d/.test(newPassword) ? '✓' : '○'}
            </div>
          </div>
        </div>
      )}

      {state.error && (
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
          className="flex-1 bg-red-600 text-white p-2 rounded-md hover:bg-red-700"
        >
          Reset Password
        </button>
      </div>
    </form>
  );
};

export default PasswordResetForm;
