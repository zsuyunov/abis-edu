/*
"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  Send,
  Paperclip,
  MoreVertical,
  Reply,
  Archive,
  Trash2,
  User
} from "lucide-react";

interface Message {
  id: number;
  subject: string;
  body: string;
  status: "SENT" | "DELIVERED" | "READ";
  readAt?: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
  };
  receiver: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
  };
}

interface ChiefMessagesProps {
  userId: string;
}

const ChiefMessages = ({ userId }: ChiefMessagesProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["chief-messages", userId, searchTerm, filterType],
    queryFn: async () => {
      const params = new URLSearchParams({
        userId,
        search: searchTerm,
        filter: filterType
      });
      const response = await fetch(`/api/chief/messages?${params}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "READ":
        return "text-green-600";
      case "delivered":
        return "text-blue-600";
      case "sent":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header }
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600">Communicate with staff and administration</p>
          </div>
        </div>

        <button
          onClick={() => setShowComposeModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Compose Message
        </button>
      </div>

      {/* Filters }
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Messages</option>
            <option value="inbox">Inbox</option>
            <option value="sent">Sent</option>
            <option value="unread">Unread</option>
          </select>
        </div>
      </div>

      {/* Messages List }
      {messages && messages.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {message.sender.firstName.charAt(0)}{message.sender.lastName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {message.sender.firstName} {message.sender.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{message.sender.position}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${getStatusColor(message.status.toLowerCase())}`}>
                          {message.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{message.subject}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{message.body}</p>
                  </div>
                  <button className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Messages Found</h3>
            <p className="text-gray-600 mb-6">
              No messages found matching your criteria. Start a conversation to get started.
            </p>
            <button
              onClick={() => setShowComposeModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Compose Message
            </button>
          </div>
        </div>
      )}

      {/* Compose Message Modal }
      {showComposeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Compose Message</h2>
              <button
                onClick={() => setShowComposeModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="">Select recipient</option>
                    <option value="support_director">Support Director</option>
                    <option value="doctor">Doctor</option>
                    <option value="main_director">Main Director</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter message subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your message"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                    Attach File
                  </button>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowComposeModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Message Detail Modal }
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {selectedMessage.sender.firstName.charAt(0)}{selectedMessage.sender.lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedMessage.subject}</h2>
                  <p className="text-sm text-gray-600">
                    From: {selectedMessage.sender.firstName} {selectedMessage.sender.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Sent: {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  selectedMessage.status === 'READ' ? 'bg-green-100 text-green-700' :
                  selectedMessage.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedMessage.status}
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.body}</p>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors">
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChiefMessages;

*/