"use client";

import { useState } from "react";
import Image from "next/image";

interface PasswordInputProps {
  register: any;
  error?: any;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  required?: boolean;
}

const PasswordInput = ({
  register,
  error,
  placeholder = "Enter password",
  defaultValue = "",
  className = "ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400",
  required = false,
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        {...register}
        className={className}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none text-sm font-mono"
        title={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? "🙈" : "👁️"}
      </button>
      {error?.message && (
        <p className="text-xs text-red-400 mt-1">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default PasswordInput;
