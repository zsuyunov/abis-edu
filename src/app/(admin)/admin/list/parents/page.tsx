import FormContainer from "@/components/FormContainer";
import SmallParentResetPasswordModal from "@/components/SmallParentResetPasswordModal";
import SmallParentSendMessageModal from "@/components/SmallParentSendMessageModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Parent, Prisma, Student } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";

type ParentList = Parent & { 
  studentParents: { 
    student: { 
      id: string; 
      firstName: string; 
      lastName: string; 
    } 
  }[] 
};

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const headersList = headers();
  const role = headersList.get("x-user-role") || "";
  const currentUserId = headersList.get("x-user-id") || "";

  const columns = [
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Parent ID",
      accessor: "parentId",
      className: "hidden md:table-cell",
    },
    {
      header: "Students",
      accessor: "students",
      className: "hidden md:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Status",
      accessor: "status",
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

  const renderRow = (item: ParentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.firstName} {item.lastName}</h3>
          <p className="text-xs text-gray-500">{item.phone}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {item.parentId}
        </span>
      </td>
      <td className="hidden md:table-cell">
        {item.studentParents && item.studentParents.length > 0 
          ? item.studentParents.map((sp) => `${sp.student.firstName} ${sp.student.lastName}`).join(", ")
          : "No students assigned"
        }
      </td>
      <td className="hidden lg:table-cell">{item.phone}</td>
      <td className="hidden lg:table-cell">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            item.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.status}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/admin/list/parents/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && (
            <>
              <FormContainer table="parent" type="update" data={item} />
              <SmallParentResetPasswordModal 
                parentId={item.id} 
                parentName={`${item.firstName} ${item.lastName}`}
                currentUserId={currentUserId}
              />
              <SmallParentSendMessageModal 
                parentId={item.id} 
                parentName={`${item.firstName} ${item.lastName}`}
                currentUserId={currentUserId}
              />
              <FormContainer table="parent" type="unassign" data={item} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.ParentWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.OR = [
              { firstName: { contains: value, mode: "insensitive" } },
              { lastName: { contains: value, mode: "insensitive" } },
              { parentId: { contains: value, mode: "insensitive" } },
              { phone: { contains: value, mode: "insensitive" } },
            ];
            break;
          case "status":
            query.status = value === "active" ? "ACTIVE" : "INACTIVE";
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.parent.findMany({
      where: query,
      include: {
        studentParents: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.parent.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Parents</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ParentListPage;