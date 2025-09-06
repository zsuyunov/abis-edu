"use client";

import React, { useState } from "react";
import { useChiefEvents } from "@/hooks/useChief";

export default function ChiefEventsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useChiefEvents(page, search);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/chief/events", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ title, description, startTime, endTime }) 
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setStartTime("");
        setEndTime("");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading events</div>;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Events</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <input 
            className="border rounded px-2 py-1 text-sm" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search..." 
          />
        </div>
      </div>

      {/* Create Event Form */}
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
        <input 
          className="border rounded px-2 py-1" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Title" 
          required 
        />
        <input 
          className="border rounded px-2 py-1 md:col-span-2" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Description" 
        />
        <input 
          className="border rounded px-2 py-1" 
          type="datetime-local" 
          value={startTime} 
          onChange={(e) => setStartTime(e.target.value)} 
          required 
        />
        <input 
          className="border rounded px-2 py-1" 
          type="datetime-local" 
          value={endTime} 
          onChange={(e) => setEndTime(e.target.value)} 
          required 
        />
        <button 
          disabled={submitting} 
          className="bg-green-600 text-white px-3 py-1 rounded text-sm md:col-span-4"
        >
          {submitting ? "Creating..." : "Create Event"}
        </button>
      </form>

      {/* Events List */}
      <div className="space-y-2">
        {(data?.data || []).map((ev: any) => (
          <div key={ev.id} className="border rounded p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{ev.title}</h3>
                <p className="text-sm text-gray-600">{ev.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(ev.startTime).toLocaleString()} - {new Date(ev.endTime).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={async () => { 
                  await fetch(`/api/chief/events?id=${ev.id}`, { method: 'DELETE' }); 
                  window.location.reload(); 
                }} 
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
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