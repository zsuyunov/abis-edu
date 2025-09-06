"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "@/components/ui/Toast";
import { InlineGifLoader } from "@/components/ui/CustomGifLoader";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainer from "@/components/FormContainer";

interface Message {
  id: string;
  subject: string;
  content: string;
  senderId: string;
  sender: {
    firstName: string;
    lastName: string;
    role: string;
  };
  recipients: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    branchId: number;
    branch: {
      shortName: string;
    };
  }[];
  branchId: number;
  branch: {
    shortName: string;
  };
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "SENT" | "DELIVERED" | "READ";
  createdAt: string;
}

interface Branch {
  id: number;
  shortName: string;
}

const MainAdmissionMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useState({
    branchId: "",
    priority: "",
    status: "",
  });

  useEffect(() => {
    fetchMessages();
    fetchBranches();
  }, [page, searchParams]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...(searchParams.branchId && { branchId: searchParams.branchId }),
        ...(searchParams.priority && { priority: searchParams.priority }),
        ...(searchParams.status && { status: searchParams.status }),
      });

      const response = await fetch(`/api/main-admission/messages?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setCount(data.count);
      } else {
        toast.error("Failed to load messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Error loading messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch("/api/branches");
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`/api/main-admission/messages/${messageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Message deleted successfully");
        fetchMessages();
      } else {
        toast.error("Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Error deleting message");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "READ":
        return "bg-green-100 text-green-800";
      case "DELIVERED":
        return "bg-blue-100 text-blue-800";
      case "SENT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns = [
    { key: "subject", label: "Subject" },
    { key: "sender", label: "Sender" },
    { key: "recipients", label: "Recipients" },
    { key: "branch", label: "Branch" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Date" },
    { key: "actions", label: "Actions" },
  ];

  const renderRow = (message: Message) => (
    <tr key={message.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{message.subject}</div>
        <div className="text-sm text-gray-500 max-w-xs truncate">{message.content}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {message.sender.firstName} {message.sender.lastName}
        </div>
        <div className="text-xs text-gray-500">{message.sender.role}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {message.recipients.length} recipient(s)
        </div>
        <div className="text-xs text-gray-500">
          {message.recipients.slice(0, 2).map(r => `${r.firstName} ${r.lastName}`).join(", ")}
          {message.recipients.length > 2 && "..."}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          {message.branch.shortName}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
          {message.priority}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
          {message.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {new Date(message.createdAt).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/main-admission/messages/${message.id}`, '_blank')}
            className="text-blue-600 hover:text-blue-900"
          >
            View
          </button>
          <button
            onClick={() => handleDelete(message.id)}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-4">
          <Image src="/loader-beruniy.gif" alt="Loading..." width={50} height={50} />
          <span className="text-emerald-600 font-medium">Loading Messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="bg-gradient-to-r from-emerald-100 to-green-100 p-4 rounded-lg mb-6">
        <h1 className="text-xl font-bold text-emerald-800 mb-2">Message Management - All Branches</h1>
        <p className="text-emerald-600 text-sm">Send and manage messages across all branches</p>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="hidden md:block text-lg font-semibold">All Messages ({count})</h2>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <select 
              value={searchParams.branchId} 
              onChange={(e) => handleFilterChange("branchId", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName}
                </option>
              ))}
            </select>
            <select 
              value={searchParams.priority} 
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select 
              value={searchParams.status} 
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Status</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="read">Read</option>
            </select>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 hover:bg-emerald-200 transition-colors">
              <Image src="/filter.png" alt="Filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 hover:bg-emerald-200 transition-colors">
              <Image src="/sort.png" alt="Sort" width={14} height={14} />
            </button>
            <FormContainer table="message" type="create" />
          </div>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={messages} />
      <Pagination page={page} count={count} />
    </div>
  );
};

export default MainAdmissionMessages;
