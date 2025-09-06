"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AdminMessageSchema, adminMessageSchema } from "@/lib/formValidationSchemas";
import { sendAdminMessage } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type AdminMessageFormProps = {
  type: "create";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
  currentUserId: string;
};

const AdminMessageForm = ({ type, data, setOpen, relatedData, currentUserId }: AdminMessageFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminMessageSchema>({
    resolver: zodResolver(adminMessageSchema),
    defaultValues: {
      isAllBranches: true,
      branchId: null,
      role: "MAIN_DIRECTOR",
      receiverId: "",
      subject: "",
      body: "",
      attachments: [],
      senderId: currentUserId,
    },
  });

  // Watch form values for conditional rendering
  const watchIsAllBranches = watch("isAllBranches");
  const watchBranchId = watch("branchId");
  const watchRole = watch("role");

  const [recipients, setRecipients] = useState<any[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const [state, formAction] = useFormState(
    sendAdminMessage,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  const onSubmit = handleSubmit((data) => {
    console.log("Form data:", data);
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      toast("Message sent successfully!");
      setOpen(false);
      router.refresh();
    }
  }, [state, router, setOpen]);

  // Fetch recipients when branch or role changes
  useEffect(() => {
    const fetchRecipients = async () => {
      if (!watchRole) return;

      setLoadingRecipients(true);
      try {
        const branchParam = watchIsAllBranches ? "all" : (watchBranchId?.toString() || "");
        const response = await fetch(`/api/messages/recipients?role=${watchRole}&branchId=${branchParam}`);
        
        if (response.ok) {
          const data = await response.json();
          setRecipients(data);
        } else {
          console.error("Failed to fetch recipients");
          setRecipients([]);
        }
      } catch (error) {
        console.error("Error fetching recipients:", error);
        setRecipients([]);
      } finally {
        setLoadingRecipients(false);
      }
    };

    fetchRecipients();
  }, [watchRole, watchIsAllBranches, watchBranchId]);

  // Clear recipient selection when branch/role changes
  useEffect(() => {
    setValue("receiverId", "");
  }, [watchRole, watchIsAllBranches, watchBranchId, setValue]);

  const { branches = [] } = relatedData || {};

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Send New Message</h1>

      {/* Step 1: Branch Selection */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium text-gray-800">Step 1: Select Branch</h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("isAllBranches")}
              className="rounded"
            />
            <span className="text-sm">All Branches</span>
          </label>

          {!watchIsAllBranches && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400">Select Specific Branch</label>
              <select
                {...register("branchId", { valueAsNumber: true })}
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              >
                <option value="">Choose a branch</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.shortName}
                  </option>
                ))}
              </select>
              {errors.branchId?.message && (
                <p className="text-xs text-red-400">{errors.branchId.message.toString()}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Role Selection */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium text-gray-800">Step 2: Select Recipient Role</h3>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Recipient Role</label>
          <select
            {...register("role")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          >
            <option value="MAIN_DIRECTOR">Main Director</option>
            <option value="SUPPORT_DIRECTOR">Director</option>
            <option value="MAIN_HR">Main HR</option>
            <option value="SUPPORT_HR">HR</option>
            <option value="MAIN_ADMISSION">Main Admission</option>
            <option value="SUPPORT_ADMISSION">Admission</option>
            <option value="DOCTOR">Doctor</option>
            <option value="CHIEF">Chief</option>
            <option value="TEACHER">Teacher</option>
          </select>
          {errors.role?.message && (
            <p className="text-xs text-red-400">{errors.role.message.toString()}</p>
          )}
        </div>
      </div>

      {/* Step 3: Individual User Selection */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium text-gray-800">Step 3: Select Individual Recipient</h3>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Recipient</label>
          {loadingRecipients ? (
            <div className="p-2 text-sm text-gray-500">Loading recipients...</div>
          ) : (
            <select
              {...register("receiverId")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            >
              <option value="">Choose a recipient</option>
              {recipients.map((recipient: any) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.firstName} {recipient.lastName} ({recipient.userId})
                  {recipient.branch && ` - ${recipient.branch.shortName}`}
                </option>
              ))}
            </select>
          )}
          {errors.receiverId?.message && (
            <p className="text-xs text-red-400">{errors.receiverId.message.toString()}</p>
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium text-gray-800">Message Content</h3>
        
        {/* Subject */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Subject</label>
          <input
            type="text"
            {...register("subject")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            placeholder="Enter message subject"
          />
          {errors.subject?.message && (
            <p className="text-xs text-red-400">{errors.subject.message.toString()}</p>
          )}
        </div>

        {/* Message Body */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Message</label>
          <textarea
            {...register("body")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            rows={6}
            placeholder="Enter your message here..."
          />
          {errors.body?.message && (
            <p className="text-xs text-red-400">{errors.body.message.toString()}</p>
          )}
        </div>

        {/* Attachments (Future enhancement) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Attachments (Optional)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
            <p className="text-sm text-gray-500">File attachments will be available in future versions</p>
          </div>
        </div>
      </div>

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}

      <button 
        type="submit"
        className="bg-blue-400 text-white p-2 rounded-md hover:bg-blue-500 disabled:opacity-50"
        disabled={loadingRecipients}
      >
        Send Message
      </button>
    </form>
  );
};

export default AdminMessageForm;
