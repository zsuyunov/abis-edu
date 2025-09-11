import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { markMessageAsRead } from "@/lib/actions";

const MessageDetailPage = async ({ params }: { params: { id: string } }) => {
  const messageId = parseInt(params.id);
  
  if (isNaN(messageId)) {
    notFound();
  }

  // Get user info from middleware headers
  const headersList = headers();
  const currentUserId = headersList.get("x-user-id") || "";

  // Fetch message details
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          userId: true,
          position: true,
        },
      },
      receiver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          userId: true,
          position: true,
        },
      },
      branch: {
        select: {
          id: true,
          shortName: true,
        },
      },
      attachments: true,
    },
  });

  if (!message) {
    notFound();
  }

  // Check if current user is involved in this message
  const isRecipient = message.receiverId === currentUserId;
  const isSender = message.senderId === currentUserId;
  
  if (!isRecipient && !isSender) {
    notFound();
  }

  // Mark as read if current user is the recipient and message is unread
  if (isRecipient && (message.status === "SENT" || message.status === "DELIVERED")) {
    await prisma.message.update({
      where: { id: messageId },
      data: { 
        status: "READ",
        readAt: new Date(),
      },
    });
  }

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/messages" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Image src="/close.png" alt="back" width={16} height={16} />
            <span>Back to Messages</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Message Status */}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            message.status === "READ" 
              ? "bg-green-100 text-green-800" 
              : "bg-yellow-100 text-yellow-800"
          }`}>
            {message.status}
          </span>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {isSender && (
              <MessageActionForm messageId={messageId} action="delete" />
            )}
          </div>
        </div>
      </div>

      {/* MESSAGE DETAILS */}
      <div className="space-y-6">
        {/* Participants */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">From</label>
              <div className="mt-1">
                <div className="font-medium text-gray-900">
                  {message.sender.firstName} {message.sender.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  {message.sender.position} • {message.sender.userId}
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">To</label>
              <div className="mt-1">
                <div className="font-medium text-gray-900">
                  {message.receiver.firstName} {message.receiver.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  {message.receiver.position} • {message.receiver.userId}
                </div>
              </div>
            </div>
          </div>
          
          {message.branch && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-600">Branch Context</label>
              <div className="mt-1 text-gray-900">
                {message.branch.shortName}
              </div>
            </div>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="text-sm font-medium text-gray-600">Subject</label>
          <h1 className="text-xl font-semibold text-gray-900 mt-1">
            {message.subject}
          </h1>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>Sent: {new Date(message.createdAt).toLocaleString()}</span>
          {message.readAt && (
            <span>Read: {new Date(message.readAt).toLocaleString()}</span>
          )}
        </div>

        {/* Message Body */}
        <div>
          <label className="text-sm font-medium text-gray-600">Message</label>
          <div className="mt-2 bg-gray-50 p-4 rounded-lg">
            <div className="whitespace-pre-wrap text-gray-900">
              {message.body}
            </div>
          </div>
        </div>

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-600">Attachments</label>
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment: any) => (
                <div key={attachment.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    <Image 
                      src={attachment.fileType === "image" ? "/image.png" : 
                            attachment.fileType === "voice" ? "/voice.png" : "/file.png"} 
                      alt="attachment" 
                      width={20} 
                      height={20} 
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{attachment.originalName}</div>
                    <div className="text-sm text-gray-500">
                      {attachment.fileType} • {(attachment.fileSize / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <a 
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply Button (if recipient) */}
        {isRecipient && (
          <div className="pt-6 border-t border-gray-200">
            <ReplyMessageForm 
              originalMessage={message}
              currentUserId={currentUserId}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Message Action Form Component
const MessageActionForm = ({ messageId, action }: { messageId: number; action: "delete" }) => {
  const handleAction = async (formData: FormData) => {
    "use server";
    
    formData.append("messageId", messageId.toString());
    
    if (action === "delete") {
      // Note: We'd implement deleteMessage action here
      // For now, we'll just redirect back
    }
  };

  return (
    <form action={handleAction}>
      <button
        type="submit"
        className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
      >
        <Image src="/delete.png" alt="delete" width={14} height={14} />
        <span className="text-sm">Delete</span>
      </button>
    </form>
  );
};

// Reply Message Form Component
const ReplyMessageForm = ({ originalMessage, currentUserId }: { originalMessage: any; currentUserId: string }) => {
  const handleReply = async (formData: FormData) => {
    "use server";
    
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    
    if (!subject || !body) {
      return;
    }

    try {
      await prisma.message.create({
        data: {
          senderId: currentUserId,
          receiverId: originalMessage.senderId,
          branchId: originalMessage.branchId,
          role: originalMessage.sender.position,
          subject: subject.startsWith("Re: ") ? subject : `Re: ${subject}`,
          body,
          status: "SENT",
        },
      });
      
      // Redirect back to messages
      // revalidatePath would be used here
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  return (
    <form action={handleReply} className="space-y-4">
      <h3 className="font-medium text-gray-900">Reply to this message</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Subject
        </label>
        <input
          type="text"
          name="subject"
          defaultValue={originalMessage.subject.startsWith("Re: ") ? originalMessage.subject : `Re: ${originalMessage.subject}`}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Message
        </label>
        <textarea
          name="body"
          rows={6}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Type your reply here..."
          required
        />
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send Reply
        </button>
      </div>
    </form>
  );
};

export default MessageDetailPage;
