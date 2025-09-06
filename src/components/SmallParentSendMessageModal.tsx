"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { MessageSchema, messageSchema } from "@/lib/formValidationSchemas";
import { sendMessage } from "@/lib/actions";

const SmallParentSendMessageModal = ({
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
  } = useForm<MessageSchema>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      receiverId: parentId,
    },
  });

  const [state, formAction] = useFormState(sendMessage, {
    success: false,
    error: false,
    message: '',
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || `Message sent to ${parentName}!`);
      setOpen(false);
      reset();
      router.refresh();
    }
    if (state.error && state.message) {
      toast.error(state.message);
    }
  }, [state, router, parentName, reset]);

  const onSubmit = handleSubmit((data) => {
    const messageData = { ...data, senderId: currentUserId };
    formAction(messageData);
  });

  return (
    <>
      <button 
        className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
        onClick={() => setOpen(true)}
        title="Send Message"
      >
        <img src="/send.png" alt="Send Message" width={14} height={14} />
      </button>
      
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <form className="flex flex-col gap-6" onSubmit={onSubmit}>
              <h1 className="text-xl font-semibold">Send Message</h1>
              
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
                <p className="text-sm text-purple-700">
                  <strong>To:</strong> {parentName}
                </p>
              </div>

              <input type="hidden" {...register("receiverId")} />

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("subject")}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                  placeholder="Enter message subject"
                />
                {errors.subject?.message && (
                  <p className="text-xs text-red-400">
                    {errors.subject.message.toString()}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("content")}
                  className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full min-h-[120px] resize-y"
                  placeholder="Type your message here..."
                />
                {errors.content?.message && (
                  <p className="text-xs text-red-400">
                    {errors.content.message.toString()}
                  </p>
                )}
              </div>

              {state.error && !state.message && (
                <span className="text-red-500">Failed to send message. Please try again.</span>
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
                  className="flex-1 bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700"
                >
                  Send Message
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

export default SmallParentSendMessageModal;
