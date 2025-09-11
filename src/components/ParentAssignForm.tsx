"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { z } from "zod";
import { Dispatch, SetStateAction } from "react";
import { createParent, assignStudentToParent } from "@/lib/actions";
import ParentForm from "./forms/ParentForm";

const parentIdSchema = z.object({
  parentId: z.string().min(1, { message: "Parent ID is required!" }),
});

type ParentIdSchema = z.infer<typeof parentIdSchema>;

const ParentAssignForm = ({
  studentId,
  studentName,
  currentUserId,
  setOpen,
}: {
  studentId: string;
  studentName: string;
  currentUserId: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [newParentToggle, setNewParentToggle] = useState(false);
  const [existingParentToggle, setExistingParentToggle] = useState(false);
  const [parentData, setParentData] = useState<any>(null);
  const [isValidatingParent, setIsValidatingParent] = useState(false);
  const [parentValidationError, setParentValidationError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ParentIdSchema>({
    resolver: zodResolver(parentIdSchema),
  });

  const [assignState, formAction] = useFormState(assignStudentToParent, {
    success: false,
    error: false,
    message: '',
  });

  const router = useRouter();

  // Watch the parentId input
  const parentIdValue = watch("parentId");

  // Handle toggle changes
  const handleNewParentToggle = (enabled: boolean) => {
    if (enabled) {
      setExistingParentToggle(false);
      setParentData(null);
      setParentValidationError("");
    }
    setNewParentToggle(enabled);
  };

  const handleExistingParentToggle = (enabled: boolean) => {
    if (enabled) {
      setNewParentToggle(false);
      setParentData(null);
      setParentValidationError("");
    }
    setExistingParentToggle(enabled);
  };

  // Validate existing parent when ID is entered
  useEffect(() => {
    if (existingParentToggle && parentIdValue && parentIdValue.length >= 5) {
      validateParent(parentIdValue);
    } else {
      setParentData(null);
      setParentValidationError("");
    }
  }, [parentIdValue, existingParentToggle]);

  const validateParent = async (parentId: string) => {
    setIsValidatingParent(true);
    setParentValidationError("");
    
    try {
      const response = await fetch(`/api/parents/validate/${parentId}`);
      const data = await response.json();
      
      if (response.ok) {
        setParentData(data);
        setParentValidationError("");
      } else {
        setParentData(null);
        setParentValidationError(data.error || "Parent not found");
      }
    } catch (error) {
      setParentData(null);
      setParentValidationError("Error validating parent ID");
    } finally {
      setIsValidatingParent(false);
    }
  };

  const handleAssign = async () => {
    if (!parentData) return;
    
    const formData = new FormData();
    formData.append("studentId", studentId);
    formData.append("parentId", parentData.id);
    formData.append("currentUserId", currentUserId);
    
    formAction(formData);
  };

  useEffect(() => {
    if (assignState.success) {
      toast.success(assignState.message || "Student assigned to parent successfully!");
      setOpen(false);
      router.refresh();
    }
    if (assignState.error && assignState.message) {
      toast.error(assignState.message);
    }
  }, [assignState, router, setOpen]);

  return (
    <div className="p-4 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Assign Parent to {studentName}</h1>
      
      {/* Toggle Switches */}
      <div className="flex flex-col gap-4">
        {/* New Parent Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">Create New Parent</span>
            <span className="text-sm text-gray-500">Create a new parent and assign to this student</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={newParentToggle}
              onChange={(e) => handleNewParentToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>

        {/* Existing Parent Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">Assign Existing Parent</span>
            <span className="text-sm text-gray-500">Assign this student to an existing parent</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={existingParentToggle}
              onChange={(e) => handleExistingParentToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
      </div>

      {/* New Parent Form */}
      {newParentToggle && (
        <div className="border-t pt-4">
          <ParentForm
            type="create"
            data={{ studentId }}
            setOpen={setOpen}
            relatedData={undefined}
          />
        </div>
      )}

      {/* Existing Parent Form */}
      {existingParentToggle && (
        <div className="border-t pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Enter Parent ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("parentId")}
                className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full"
                placeholder="Enter parent ID (e.g., P12345)"
              />
              {errors.parentId?.message && (
                <p className="text-xs text-red-400">{errors.parentId.message}</p>
              )}
            </div>

            {/* Parent Validation Result */}
            {isValidatingParent && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Validating parent ID...</span>
              </div>
            )}

            {parentValidationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{parentValidationError}</p>
              </div>
            )}

            {parentData && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Parent Found: {parentData.firstName} {parentData.lastName}
                    </p>
                    <p className="text-xs text-green-600">ID: {parentData.parentId}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="px-3 py-1 bg-gray-400 text-white rounded-md text-sm hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAssign}
                      className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No toggle selected message */}
      {!newParentToggle && !existingParentToggle && (
        <div className="text-center py-8 text-gray-500">
          <p>Please select either "Create New Parent" or "Assign Existing Parent" to continue.</p>
        </div>
      )}
    </div>
  );
};

export default ParentAssignForm;
