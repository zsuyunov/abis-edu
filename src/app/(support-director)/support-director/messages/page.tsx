"use client";

import { useState } from "react";
import { useSDMessages } from "@/hooks/useSupportDirector";

export default function SDMessagesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useSDMessages(page, search);
  const [text, setText] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editText, setEditText] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/support-director/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, receiverId }) });
      if (!res.ok) throw new Error(await res.text());
      setText(""); setReceiverId("");
      location.reload();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  }

  return (
    <div className="bg-white p-4 rounded-md m-4 mt-0">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold">Messages (Branch)</h1>
        <input className="border rounded px-2 py-1 text-sm" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search..." />
      </div>
      <form onSubmit={handleSend} className="border rounded p-3 mb-4 grid gap-2 grid-cols-1 md:grid-cols-4">
        <input className="border rounded px-2 py-1" value={receiverId} onChange={(e)=>setReceiverId(e.target.value)} placeholder="Receiver ID" required />
        <input className="border rounded px-2 py-1 md:col-span-2" value={text} onChange={(e)=>setText(e.target.value)} placeholder="Message" required />
        <button disabled={submitting} className="bg-green-600 text-white px-3 py-1 rounded text-sm">{submitting?"Sending...":"Send"}</button>
      </form>
      {error && <div className="text-red-600">{String(error)}</div>}
      {isLoading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Text</th>
              <th className="py-2">Created</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.data || []).map((m: any)=> (
              <tr key={m.id} className="border-b last:border-0">
                <td className="py-2">
                  {editingId === m.id ? (
                    <input className="border rounded px-2 py-1 w-full" value={editText} onChange={(e)=>setEditText(e.target.value)} />
                  ) : m.text}
                </td>
                <td className="py-2">{new Date(m.createdAt).toLocaleString()}</td>
                <td className="py-2">
                  {editingId === m.id ? (
                    <div className="flex gap-2">
                      <button onClick={async()=>{ await fetch('/api/support-director/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, text: editText }) }); location.reload(); }} className="text-green-600 hover:underline">Save</button>
                      <button onClick={()=> setEditingId(null)} className="text-gray-600 hover:underline">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={()=>{ setEditingId(m.id); setEditText(m.text); }} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={async()=>{ await fetch(`/api/support-director/messages?id=${m.id}`, { method: 'DELETE' }); location.reload(); }} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


