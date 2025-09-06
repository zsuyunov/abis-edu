import Image from "next/image";
import Link from "next/link";
import FormContainer from "@/components/FormContainer";
import { Suspense } from "react";
import { headers } from "next/headers";

const AdminMessagesPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const activeTab = searchParams.tab || "inbox";
  
  // Get user info from middleware headers
  const headersList = headers();
  const currentUserId = headersList.get("x-user-id") || "";

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Messages</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* MESSAGE TYPE TABS */}
          <div className="flex gap-2">
            <Link 
              href="/admin/messages?tab=inbox"
              className={`px-4 py-2 rounded-md text-sm ${
                activeTab === "inbox" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Inbox
            </Link>
            <Link 
              href="/admin/messages?tab=outbox"
              className={`px-4 py-2 rounded-md text-sm ${
                activeTab === "outbox" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sent
            </Link>
            <Link 
              href="/admin/messages?tab=unread"
              className={`px-4 py-2 rounded-md text-sm ${
                activeTab === "unread" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Unread
            </Link>
          </div>
          
          {/* NEW MESSAGE BUTTON */}
          <div className="flex items-center gap-4 self-end">
            <FormContainer table="message" type="create" />
          </div>
        </div>
      </div>

      {/* MESSAGE STATS */}
      <Suspense fallback={<div>Loading stats...</div>}>
        <MessageStats userId={currentUserId} />
      </Suspense>

      {/* MESSAGES LIST */}
      <Suspense fallback={<div>Loading messages...</div>}>
        <MessagesList type={activeTab} userId={currentUserId} />
      </Suspense>
    </div>
  );
};

// Message Statistics Component
const MessageStats = async ({ userId }: { userId: string }) => {
  try {
    const response = await fetch(`/api/messages/stats?userId=${userId}`, {
      cache: "no-store",
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }
    
    const stats = await response.json();

    return (
      <div className="flex gap-4 justify-center mb-6">
        <div className="bg-blue-100 p-4 rounded-md">
          <div className="flex items-center gap-2">
            <Image src="/mail.png" alt="" width={20} height={20} />
            <span className="text-[10px] text-blue-600">TOTAL RECEIVED</span>
          </div>
          <h1 className="text-2xl font-semibold my-4">{stats.total.received}</h1>
          <h2 className="capitalize text-sm font-medium text-blue-600">
            {stats.recent.received} this week
          </h2>
        </div>
        
        <div className="bg-green-100 p-4 rounded-md">
          <div className="flex items-center gap-2">
            <Image src="/message.png" alt="" width={20} height={20} />
            <span className="text-[10px] text-green-600">TOTAL SENT</span>
          </div>
          <h1 className="text-2xl font-semibold my-4">{stats.total.sent}</h1>
          <h2 className="capitalize text-sm font-medium text-green-600">
            {stats.recent.sent} this week
          </h2>
        </div>
        
        <div className="bg-yellow-100 p-4 rounded-md">
          <div className="flex items-center gap-2">
            <Image src="/announcement.png" alt="" width={20} height={20} />
            <span className="text-[10px] text-yellow-600">UNREAD</span>
          </div>
          <h1 className="text-2xl font-semibold my-4">{stats.total.unread}</h1>
          <h2 className="capitalize text-sm font-medium text-yellow-600">
            {stats.unreadPercentage}% of received
          </h2>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching message stats:", error);
    return (
      <div className="text-center text-gray-500 mb-6">
        Unable to load message statistics
      </div>
    );
  }
};

// Messages List Component
const MessagesList = async ({ type, userId }: { type: string; userId: string }) => {
  try {
    const response = await fetch(`/api/messages?type=${type}&userId=${userId}&limit=50`, {
      cache: "no-store",
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }
    
    const { messages } = await response.json();

    if (messages.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          No {type} messages found
        </div>
      );
    }

    return (
      <div className="mt-4">
        <div className="space-y-2">
          {messages.map((message: any) => (
            <MessageCard key={message.id} message={message} type={type} />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return (
      <div className="text-center text-red-500 py-8">
        Error loading messages
      </div>
    );
  }
};

// Individual Message Card Component
const MessageCard = ({ message, type }: { message: any; type: string }) => {
  const isUnread = message.status === "SENT" || message.status === "DELIVERED";
  const isInbox = type === "inbox" || type === "unread";
  const otherUser = isInbox ? message.sender : message.receiver;

  return (
    <Link href={`/admin/messages/${message.id}`}>
      <div className={`p-4 border rounded-md hover:bg-gray-50 transition-colors ${
        isUnread && isInbox ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Status Indicator */}
            <div className={`w-3 h-3 rounded-full ${
              isUnread && isInbox ? "bg-blue-500" : "bg-gray-300"
            }`} />
            
            {/* User Info */}
            <div className="flex flex-col">
              <span className={`font-medium ${isUnread && isInbox ? "text-blue-900" : "text-gray-900"}`}>
                {isInbox ? "From" : "To"}: {otherUser.firstName} {otherUser.lastName}
              </span>
              <span className="text-xs text-gray-500">
                {otherUser.position} {otherUser.userId}
                {message.branch && ` • ${message.branch.shortName}`}
              </span>
            </div>
          </div>

          {/* Message Info */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-500">
              {new Date(message.createdAt).toLocaleDateString()}
            </span>
            {message._count?.attachments > 0 && (
              <div className="flex items-center gap-1">
                <Image src="/attachment.png" alt="attachment" width={12} height={12} />
                <span className="text-xs text-gray-500">{message._count.attachments}</span>
              </div>
            )}
          </div>
        </div>

        {/* Subject */}
        <div className="mt-2">
          <h3 className={`font-medium ${isUnread && isInbox ? "text-blue-900" : "text-gray-900"}`}>
            {message.subject}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {message.body}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default AdminMessagesPage;
