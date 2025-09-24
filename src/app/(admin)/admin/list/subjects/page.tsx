import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SubjectActionModal from "@/components/SubjectActionModal";
import SubjectDeleteModal from "@/components/SubjectDeleteModal";
import SubjectTeachersModal from "@/components/SubjectTeachersModal";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import { headers } from "next/headers";

type SubjectList = Subject & {
  TeacherAssignment?: Array<{
    Teacher: {
      id: string;
      firstName: string;
      lastName: string;
      teacherId: string;
    };
    Branch: {
      id: number;
      shortName: string;
      district: string;
    };
    Class: {
      id: number;
      name: string;
      academicYear: {
        id: number;
        name: string;
        isCurrent: boolean;
      };
    };
    role: string;
  }>
};

const SubjectListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const headersList = headers();
  const role = headersList.get("x-user-role") || "";
  const currentUserId = headersList.get("x-user-id") || "";

  const columns = [
    {
      header: "ID",
      accessor: "id",
      className: "hidden sm:table-cell",
    },
    {
      header: "Subject Name",
      accessor: "name",
    },
    {
      header: "Status",
      accessor: "status",
      className: "hidden md:table-cell",
    },
    {
      header: "Teachers Count",
      accessor: "teachers",
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderRow = (item: SubjectList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="hidden sm:table-cell p-4 font-mono text-sm text-gray-600">
        #{item.id}
      </td>
      <td className="flex items-center gap-4 p-4 font-medium">{item.name}</td>
      <td className="hidden md:table-cell">
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            {(item.TeacherAssignment?.length ?? 0)} teachers
          </span>
          {(item.TeacherAssignment?.length ?? 0) > 0 && (
            <SubjectTeachersModal subject={item} />
          )}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <FormContainer table="subject" type="update" data={item} />
          {item.status === "ACTIVE" ? (
            <SubjectActionModal
              table="subject"
              type="archive"
              data={item}
              currentUserId={currentUserId}
            />
          ) : (
            <SubjectActionModal
              table="subject"
              type="restore"
              data={item}
              currentUserId={currentUserId}
            />
          )}
          <SubjectDeleteModal
            data={item}
            currentUserId={currentUserId}
          />
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.SubjectWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
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
    prisma.subject.findMany({
      where: query,
      include: {
        TeacherAssignment: {
          include: {
            Teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                teacherId: true
              }
            },
            Branch: {
              select: {
                id: true,
                shortName: true,
                district: true
              }
            },
            Class: {
              select: {
                id: true,
                name: true,
                academicYear: {
                  select: {
                    id: true,
                    name: true,
                    isCurrent: true
                  }
                }
              }
            }
          }
        }
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.subject.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="hidden md:block text-lg font-semibold">All Subjects</h1>
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
            <FormContainer table="subject" type="create" />
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

export default SubjectListPage;
