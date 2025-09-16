import FormContainer from "@/components/FormContainer";
import ArchiveRestoreButton from "@/components/ArchiveRestoreButton";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma } from "@prisma/client";
import Image from "next/image";
import { headers } from "next/headers";
import { getUserFromToken } from "@/lib/auth-utils";

type ClassList = Class & {
  branch: { shortName: string };
  TeacherAssignment?: Array<{
    Teacher: {
      id: string;
      firstName: string;
      lastName: string;
      teacherId: string;
    }
  }>;
};

const ClassListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

  const headersList = headers();
  const roleFromHeaders = headersList.get("x-user-role");
  const userIdFromHeaders = headersList.get("x-user-id");
  
  // Fallback to JWT token if headers are not set
  const userFromToken = await getUserFromToken();
  const role = roleFromHeaders || userFromToken.role;
  const currentUserId = userIdFromHeaders || userFromToken.id || "";


const columns = [
  {
    header: "ID",
    accessor: "id",
    className: "hidden sm:table-cell",
  },
  {
    header: "Class Name",
    accessor: "name",
  },
  {
    header: "Capacity",
    accessor: "capacity",
    className: "hidden md:table-cell",
  },
  {
    header: "Branch",
    accessor: "branch",
    className: "hidden md:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
  },
  {
    header: "Supervisor",
    accessor: "supervisorId",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const renderRow = (item: ClassList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="hidden sm:table-cell p-4 font-mono text-sm text-gray-600">
      #{item.id}
    </td>
    <td className="flex items-center gap-4 p-4">{item.name}</td>
    <td className="hidden md:table-cell">{item.capacity}</td>
    <td className="hidden md:table-cell">{(item as any).branch?.shortName ?? '—'}</td>
    <td className="hidden md:table-cell">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        item.status === 'ACTIVE' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {item.status}
      </span>
    </td>
    <td className="hidden md:table-cell">
      {item.TeacherAssignment && item.TeacherAssignment.length > 0 
        ? `${item.TeacherAssignment[0].Teacher.firstName} ${item.TeacherAssignment[0].Teacher.lastName} (${item.TeacherAssignment[0].Teacher.teacherId})`
        : "No Supervisor"
      }
    </td>
    <td>
      <div className="flex items-center gap-2">
        {/* Debug: Always show buttons for testing */}
        <FormContainer table="class" type="update" data={item} currentUserId={currentUserId} />
        {item.status === "ACTIVE" ? (
          <FormContainer table="class" type="archive" data={item} currentUserId={currentUserId} />
        ) : (
          <FormContainer table="class" type="restore" data={item} currentUserId={currentUserId} />
        )}
        <FormContainer table="class" type="delete" data={item} currentUserId={currentUserId} />
      </div>
    </td>
  </tr>
);

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.ClassWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "supervisorId":
            // Supervisor filtering not available in current schema
            break;
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.class.findMany({
      where: query,
      include: { 
        branch: { select: { shortName: true } },
        TeacherAssignment: {
          where: { role: "SUPERVISOR" },
          include: {
            Teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                teacherId: true
              }
            }
          }
        }
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.class.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="hidden md:block text-lg font-semibold">All Classes</h1>
          <p className="text-xs text-gray-500">Role: {role || "No role"} | User ID: {currentUserId || "No ID"}</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <FormContainer table="class" type="create" currentUserId={currentUserId} />
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

export default ClassListPage;
