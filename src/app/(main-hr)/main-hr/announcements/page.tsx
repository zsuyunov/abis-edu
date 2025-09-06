"use client";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Image from "next/image";
import { useState, useEffect } from "react";

type Announcement = {
  id: number;
  title: string;
  description: string;
  date: string;
  targetAudience: string;
  branches: string[];
  createdBy: string;
};

const columns = [
  {
    header: "Title",
    accessor: "title",
  },
  {
    header: "Description",
    accessor: "description",
    className: "hidden md:table-cell",
  },
  {
    header: "Target Audience",
    accessor: "targetAudience",
    className: "hidden md:table-cell",
  },
  {
    header: "Branches",
    accessor: "branches",
    className: "hidden lg:table-cell",
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const MainHRAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const renderRow = (item: Announcement) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">
        <h3 className="font-semibold">{item.title}</h3>
      </td>
      <td className="hidden md:table-cell p-4">
        <div className="text-xs text-gray-500 max-w-xs truncate">
          {item.description}
        </div>
      </td>
      <td className="hidden md:table-cell p-4">
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
          {item.targetAudience}
        </span>
      </td>
      <td className="hidden lg:table-cell p-4">
        <div className="flex flex-wrap gap-1">
          {item.branches.slice(0, 2).map((branch) => (
            <span
              key={branch}
              className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
            >
              {branch}
            </span>
          ))}
          {item.branches.length > 2 && (
            <span className="text-xs text-gray-500">
              +{item.branches.length - 2} more
            </span>
          )}
        </div>
      </td>
      <td className="hidden lg:table-cell p-4 text-xs text-gray-500">
        {new Date(item.date).toLocaleDateString()}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <FormModal table="announcement" type="update" data={item} />
          <FormModal table="announcement" type="delete" id={item.id} />
        </div>
      </td>
    </tr>
  );

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/main-hr/announcements?page=${currentPage}&search=${searchTerm}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAnnouncements(data.announcements);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">Announcements Management (All Branches)</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <FormModal table="announcement" type="create" />
          </div>
        </div>
      </div>
      
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={announcements} />
      
      {/* PAGINATION */}
      <Pagination 
        page={currentPage}
        count={totalPages * 10}
      />
    </div>
  );
};

export default MainHRAnnouncementsPage;
