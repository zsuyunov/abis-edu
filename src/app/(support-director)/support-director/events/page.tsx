"use client";

import React, { useState } from "react";
import { useSDEvents } from "@/hooks/useSupportDirector";

export default function SDEventsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useSDEvents(page, search);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/support-director/events", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ title, description, startTime }) 
      });
      if (!res.ok) throw new Error(await res.text());
      setTitle(""); 
      setDescription(""); 
      setStartTime("");
      window.location.reload();
    } catch (err) { 
      console.error(err); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/support-director/events?id=${id}`, { method: 'DELETE' });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white p-4 rounded-md m-4 mt-0">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold">Events (Branch)</h1>
        <input 
          className="border rounded px-2 py-1 text-sm" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search..." 
        />
      </div>
      
      <form onSubmit={handleCreate} className="border rounded p-3 mb-4 grid gap-2 grid-cols-1 md:grid-cols-4">
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
        <button 
          disabled={submitting} 
          className="bg-green-600 text-white px-3 py-1 rounded text-sm md:col-span-4"
        >
          {submitting ? "Creating..." : "Create Event"}
        </button>
      </form>
      
      {error && (
        <div className="text-red-600">{String(error)}</div>
      )}
      
      {isLoading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Title</th>
                <th className="py-2">Start</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map((ev: any) => (
                <tr key={ev.id} className="border-b last:border-0">
                  <td className="py-2">{ev.title}</td>
                  <td className="py-2">{new Date(ev.startTime).toLocaleString()}</td>
                  <td className="py-2">
                    <button 
                      onClick={() => handleDelete(ev.id)} 
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {data?.pagination && (
            <div className="flex items-center justify-end gap-2 mt-3">
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
        </>
      )}
    </div>
  );
}