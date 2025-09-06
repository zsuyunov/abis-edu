import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AcademicYearActionModal from "@/components/AcademicYearActionModal";
import AcademicYearSetCurrentModal from "@/components/AcademicYearSetCurrentModal";
import AcademicYearAutoDeactivateButton from "@/components/AcademicYearAutoDeactivateButton";

import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { AcademicYear, AcademicYearStatus, Semester, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

import { headers } from "next/headers";

type AcademicYearList = AcademicYear & { semesters: Semester[] };

const AcademicYearListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const headersList = headers();
  const role = headersList.get("x-user-role") || "";
  const currentUserId = headersList.get("x-user-id") || "";

  const columns = [
    {
      header: "Academic Year",
      accessor: "name",
    },
    {
      header: "Duration",
      accessor: "duration",
      className: "hidden md:table-cell",
    },
    {
      header: "Status",
      accessor: "status",
      className: "hidden md:table-cell",
    },
    {
      header: "Semesters",
      accessor: "semestersCount",
      className: "hidden lg:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const getStatusColor = (status: AcademicYearStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "INACTIVE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const renderRow = (item: AcademicYearList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src="/calendar.png"
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex flex-col">
          <span className="text-xs">
            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
          </span>
          <span className="text-xs text-gray-500">
            ({Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24))} days)
          </span>
          {/* Progress indicator */}
          <div className="mt-1">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  new Date() > new Date(item.endDate) 
                    ? 'bg-red-500' 
                    : new Date() > new Date(item.startDate) 
                      ? 'bg-blue-500' 
                      : 'bg-gray-400'
                }`}
                style={{ 
                  width: `${Math.min(
                    Math.max(
                      ((new Date().getTime() - new Date(item.startDate).getTime()) / 
                       (new Date(item.endDate).getTime() - new Date(item.startDate).getTime())) * 100, 
                      0
                    ), 
                    100
                  )}%` 
                }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">
              {new Date() > new Date(item.endDate) 
                ? 'Completed' 
                : new Date() > new Date(item.startDate) 
                  ? 'In Progress' 
                  : 'Upcoming'
              }
            </span>
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span
          className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
            item.status
          )}`}
        >
          {item.status}
        </span>
      </td>
      <td className="hidden lg:table-cell">
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
          {item.semesters.length}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="academicYear" type="update" data={item} />
              <Link href={`/admin/list/academic-years/${item.id}`}>
                                                         <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95" title="View">
               <Image src="/view.png" alt="" width={16} height={16} />
             </button>
              </Link>
              {item.status === "ACTIVE" ? (
                <AcademicYearActionModal 
                  table="academicYear" 
                  type="archive" 
                  data={item} 
                  currentUserId={currentUserId}
                />
              ) : (
                <AcademicYearActionModal 
                  table="academicYear" 
                  type="restore" 
                  data={item} 
                  currentUserId={currentUserId}
                />
              )}
              <AcademicYearActionModal 
                table="academicYear" 
                type="delete" 
                data={item} 
                currentUserId={currentUserId}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.AcademicYearWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value.trim() !== "") {
        switch (key) {
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
          case "status":
            query.status = value as AcademicYearStatus;
            break;
          case "current":
            query.isCurrent = value === "true";
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.academicYear.findMany({
      where: query,
      include: {
        semesters: {
          orderBy: { startDate: "asc" }
        }
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: {
        startDate: "desc",
      },
    }),
    prisma.academicYear.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Academic Years</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormContainer table="academicYear" type="create" />
            )}
          </div>
        </div>
      </div>
      
      {/* Auto-Deactivation Tool */}
      {role === "admin" && <AcademicYearAutoDeactivateButton />}
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AcademicYearListPage;
