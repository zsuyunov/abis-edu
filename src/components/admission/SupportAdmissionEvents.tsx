"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "@/components/ui/Toast";
import { InlineGifLoader } from "@/components/ui/CustomGifLoader";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainer from "@/components/FormContainer";

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

interface BranchInfo {
  id: number;
  shortName: string;
  legalName: string;
}

const SupportAdmissionEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useState({
    status: "",
  });

  useEffect(() => {
    fetchEvents();
    fetchBranchInfo();
  }, [page, searchParams]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...(searchParams.status && { status: searchParams.status }),
      });

      const response = await fetch(`/api/support-admission/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
        setCount(data.count);
      } else {
        toast.error("Failed to load events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Error loading events");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchInfo = async () => {
    try {
      const response = await fetch("/api/support-admission/branch-info");
      if (response.ok) {
        const data = await response.json();
        setBranchInfo(data.branch);
      }
    } catch (error) {
      console.error("Error fetching branch info:", error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleStatusChange = async (eventId: string, newStatus: "ACTIVE" | "INACTIVE") => {
    try {
      const response = await fetch(`/api/support-admission/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Event ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`);
        fetchEvents();
      } else {
        toast.error("Failed to update event status");
      }
    } catch (error) {
      console.error("Error updating event status:", error);
      toast.error("Error updating event status");
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`/api/support-admission/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Event deleted successfully");
        fetchEvents();
      } else {
        toast.error("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Error deleting event");
    }
  };

  const columns = [
    { header: "Event Title", accessor: "title" },
    { header: "Description", accessor: "description" },
    { header: "Start Date", accessor: "startDate" },
    { header: "End Date", accessor: "endDate" },
    { header: "Location", accessor: "location" },
    { header: "Status", accessor: "status" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (event: Event) => (
    <tr key={event.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{event.title}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 max-w-xs truncate">{event.description}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {new Date(event.startDate).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {new Date(event.endDate).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{event.location}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          event.status === "ACTIVE" 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {event.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStatusChange(event.id, event.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
            className="text-indigo-600 hover:text-indigo-900"
          >
            {event.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => handleDelete(event.id)}
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
          <span className="text-purple-600 font-medium">Loading Events...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <Image src="/info.png" alt="Info" width={20} height={20} className="opacity-70" />
          <p className="text-purple-800 text-sm font-medium">
            You are managing events for branch: <span className="font-bold">{branchInfo?.shortName || "Loading..."}</span>. All events are limited to this branch.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-4 rounded-lg mb-6">
        <h1 className="text-xl font-bold text-purple-800 mb-2">Event Management - Your Branch</h1>
        <p className="text-purple-600 text-sm">Create and manage events for your assigned branch</p>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="hidden md:block text-lg font-semibold">Branch Events ({count})</h2>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <select 
              value={searchParams.status} 
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors">
              <Image src="/filter.png" alt="Filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors">
              <Image src="/sort.png" alt="Sort" width={14} height={14} />
            </button>
            <FormContainer table="event" type="create" />
          </div>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={events} />
      <Pagination page={page} count={count} />
    </div>
  );
};

export default SupportAdmissionEvents;