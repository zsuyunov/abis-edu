"use client";

import { FieldError } from "react-hook-form";
import { useState } from "react";
import { generateIdSuggestion, getIdPrefix } from "@/lib/idHelpers";

type IdInputFieldProps = {
  label: string;
  register: any;
  name: string;
  defaultValue?: string;
  error?: FieldError;
  userType: string;
  position?: string;
  onIdChange?: (id: string) => void;
};

const IdInputField = ({
  label,
  register,
  name,
  defaultValue,
  error,
  userType,
  position,
  onIdChange,
}: IdInputFieldProps) => {
  const [showSuggestion, setShowSuggestion] = useState(false);

  const prefix = getIdPrefix(userType, position);
  const suggestion = generateIdSuggestion(userType, position);

  const handleSuggestionClick = () => {
    // Find the input element and update its value
    const inputElement = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
    if (inputElement) {
      inputElement.value = suggestion;
      // Trigger the input event to update React Hook Form
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (onIdChange) {
      onIdChange(suggestion);
    }
    
    setShowSuggestion(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full md:w-1/4">
      <label className="text-xs text-gray-500">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          {...register(name)}
          defaultValue={defaultValue || ""}
          onFocus={() => setShowSuggestion(true)}
          onBlur={() => setTimeout(() => setShowSuggestion(false), 200)}
          className="border border-gray-300 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white text-gray-900 placeholder-gray-400"
          placeholder={prefix ? `${prefix}12345` : "Select position first"}
        />
        {showSuggestion && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 z-10">
            <button
              type="button"
              onClick={handleSuggestionClick}
              className="w-full text-left p-2 hover:bg-gray-100 text-sm text-blue-600"
            >
              Suggestion: {suggestion}
            </button>
          </div>
        )}
      </div>
      {error?.message && (
        <p className="text-xs text-red-400">{error.message.toString()}</p>
      )}
      {prefix && (
        <p className="text-xs text-gray-400">
          Format: {prefix}##### (e.g., {prefix}12345)
        </p>
      )}
    </div>
  );
};

export default IdInputField;
