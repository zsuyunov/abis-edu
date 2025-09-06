"use client";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Image from "next/image";
import { useState, useEffect } from "react";

type Message = {
  id: number;
  subject: string;
  body: string;
  recipient: string;
  status: string;
  createdAt: string;
};

const columns = [
  { header: "Subject", accessor: "subject" },
  { header: "Recipient", accessor: "recipient", className: "hidden md:table-cell" },
  { header: "Status", accessor: "status", className: "hidden md:table-cell" },
  { header: "Date", accessor: "createdAt", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "action" },
];

const SupportHRMessagesPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchName, setBranchName] = useState("");

  const renderRow = (item: Message) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
      <td className="p-4"><h3 className="font-semibold">{item.subject}</h3><p className="text-xs text-gray-500 truncate max-w-xs">{item.body}</p></td>
      <td className="hidden md:table-cell p-4">{item.recipient}</td>
      <td className="hidden md:table-cell p-4"><span className={`text-xs px-2 py-1 rounded ${item.status === 'READ' ? 'bg-green-100 text-green-800' : item.status === 'SENT' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{item.status}</span></td>
      <td className="hidden lg:table-cell p-4 text-xs">{new Date(item.createdAt).toLocaleString()}</td>
      <td className="p-4"><div className="flex items-center gap-2"><FormModal table="message" type="update" data={item} /><FormModal table="message" type="delete" id={item.id} /></div></td>
    </tr>
  );

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/support-hr/messages?page=${currentPage}&search=${searchTerm}`);
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages || []);
          setTotalPages(data.totalPages || 1);
          setBranchName(data.branchName || "");
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [currentPage, searchTerm]);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">{[...Array(5)].map((_, i) => (<div key={i} className="h-16 bg-gray-300 rounded"></div>))}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">Messages Management {branchName && `(${branchName})`}</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"><Image src="/filter.png" alt="" width={14} height={14} /></button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"><Image src="/sort.png" alt="" width={14} height={14} /></button>
            <FormModal table="message" type="create" />
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={messages} />
      <Pagination page={currentPage} count={totalPages * 10} />
    </div>
  );
};

export default SupportHRMessagesPage;
