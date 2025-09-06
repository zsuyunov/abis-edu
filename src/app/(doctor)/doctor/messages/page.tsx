"use client";

import React, { useState } from "react";
import { useDoctorMessages } from "@/hooks/useDoctor";

export default function DoctorMessagesPage() {
  const [activeTab, setActiveTab] = useState("inbox");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useDoctorMessages(activeTab, page, search);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/doctor/messages", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ recipient, subject, body }) 
      });
      if (res.ok) {
        setRecipient("");
        setSubject("");
        setBody("");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading messages</div>;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Messages</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* Message Type Tabs */}
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab("inbox")}
              className={`px-4 py-2 rounded-md text-sm ${
                activeTab === "inbox" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Inbox
            </button>
            <button 
              onClick={() => setActiveTab("sent")}
              className={`px-4 py-2 rounded-md text-sm ${
                activeTab === "sent" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sent
            </button>
            <button 
              onClick={() => setActiveTab("unread")}
              className={`px-4 py-2 rounded-md text-sm ${
                activeTab === "unread" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Unread
            </button>
          </div>
          
          <input 
            className="border rounded px-2 py-1 text-sm" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search messages..." 
          />
        </div>
      </div>

      {/* Send Message Form */}
      <form onSubmit={handleSendMessage} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
        <input 
          className="border rounded px-2 py-1" 
          value={recipient} 
          onChange={(e) => setRecipient(e.target.value)} 
          placeholder="Recipient (phone or email)" 
          required 
        />
        <input 
          className="border rounded px-2 py-1" 
          value={subject} 
          onChange={(e) => setSubject(e.target.value)} 
          placeholder="Subject" 
          required 
        />
        <textarea 
          className="border rounded px-2 py-1 md:col-span-3" 
          value={body} 
          onChange={(e) => setBody(e.target.value)} 
          placeholder="Message body" 
          rows={3}
          required 
        />
        <button 
          disabled={submitting} 
          className="bg-green-600 text-white px-3 py-1 rounded text-sm md:col-span-3"
        >
          {submitting ? "Sending..." : "Send Message"}
        </button>
      </form>

      {/* Messages List */}
      <div className="space-y-2">
        {(data?.data || []).map((msg: any) => (
          <div key={msg.id} className="border rounded p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{msg.subject}</h3>
                <p className="text-sm text-gray-600">{msg.body}</p>
                <p className="text-xs text-gray-500">
                  {activeTab === "sent" ? "To" : "From"}: {msg.recipient || msg.sender}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {msg.status === "SENT" && activeTab === "inbox" && (
                  <button 
                    onClick={async () => { 
                      await fetch(`/api/doctor/messages/${msg.id}/read`, { method: 'POST' }); 
                      window.location.reload(); 
                    }} 
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Mark Read
                  </button>
                )}
                <button 
                  onClick={async () => { 
                    await fetch(`/api/doctor/messages?id=${msg.id}`, { method: 'DELETE' }); 
                    window.location.reload(); 
                  }} 
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data?.pagination && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button 
            className="px-2 py-1 border rounded text-sm disabled:opacity-50" 
            onClick={() => setPage(Math.max(1, page - 1))} 
            disabled={page <= 1}
          >
            Prev
          </button>
          <span className="text-xs text-gray-500">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button 
            className="px-2 py-1 border rounded text-sm disabled:opacity-50" 
            onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))} 
            disabled={page >= (data.pagination.totalPages || 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}