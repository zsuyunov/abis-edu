import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import TimetableActionModal from "@/components/TimetableActionModal";
import TimetableTemplateManager from "@/components/TimetableTemplateManager";
import TimetableBulkUploadModal from "@/components/TimetableBulkUploadModal";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Timetable, Prisma, Subject, Teacher, Class, Branch, AcademicYear } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";

type TimetableList = Timetable & { 
  subject: Subject;
  class: Class;
  branch: Branch;
  academicYear: AcademicYear;
  teacher: Teacher;
};

const TimetableListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const headersList = headers();
  const role = headersList.get("x-user-role");
  const currentUserId = headersList.get("x-user-id") || "";

  const columns = [
    {
      header: "Subject",
      accessor: "subject",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Date & Time",
      accessor: "datetime",
      className: "hidden lg:table-cell",
    },
    {
      header: "Room",
      accessor: "room",
      className: "hidden lg:table-cell",
    },
    {
      header: "Status",
      accessor: "status",
      className: "hidden md:table-cell",
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

  const renderRow = (item: TimetableList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.subject.name}</td>
      <td>{item.class.name}</td>
      <td className="hidden md:table-cell">
        {item.teacher.firstName + " " + item.teacher.lastName}
      </td>
      <td className="hidden lg:table-cell">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">
            {new Intl.DateTimeFormat("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(new Date(item.fullDate))}
          </span>
          <span className="text-xs">
            {new Intl.DateTimeFormat("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }).format(new Date(item.startTime))} -{" "}
            {new Intl.DateTimeFormat("en-US", {
              hour: "2-digit",
              minute: "2-digit", 
              hour12: true,
            }).format(new Date(item.endTime))}
          </span>
        </div>
      </td>
      <td className="hidden lg:table-cell">
        <div className="flex flex-col">
          <span className="text-xs">{item.roomNumber}</span>
          {item.buildingName && (
            <span className="text-xs text-gray-500">{item.buildingName}</span>
          )}
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
          {role === "admin" && (
            <>
              <Link href={`/list/timetables/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95">
                  <Image src="/view.png" alt="view" width={16} height={16} />
                </button>
              </Link>
              <FormContainer table="timetable" type="update" data={item} />
              {item.status === "ACTIVE" ? (
                <TimetableActionModal
                  table="archive"
                  id={item.id.toString()}
                  currentUserId={currentUserId}
                />
              ) : (
                <TimetableActionModal
                  table="restore"
                  id={item.id.toString()}
                  currentUserId={currentUserId}
                />
              )}
              <TimetableActionModal
                table="delete"
                id={item.id.toString()}
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
  const query: Prisma.TimetableWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "branchId":
            query.branchId = parseInt(value);
            break;
          case "classId":
            query.classId = parseInt(value);
            break;
          case "academicYearId":
            query.academicYearId = parseInt(value);
            break;
          case "subjectId":
            query.subjectId = parseInt(value);
            break;
          case "teacherId":
            query.teacherId = value;
            break;
          case "status":
            query.status = value as "ACTIVE" | "INACTIVE";
            break;
          case "search":
            query.OR = [
              { subject: { name: { contains: value, mode: "insensitive" } } },
              { teacher: { firstName: { contains: value, mode: "insensitive" } } },
              { teacher: { lastName: { contains: value, mode: "insensitive" } } },
              { class: { name: { contains: value, mode: "insensitive" } } },
              { roomNumber: { contains: value, mode: "insensitive" } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.timetable.findMany({
      where: query,
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
        branch: { select: { shortName: true } },
        academicYear: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: [
        { fullDate: "desc" },
        { startTime: "asc" },
      ],
    }),
    prisma.timetable.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Timetables</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <Link href="/admin/list/timetables/view">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/calendar.png" alt="view timetable" width={14} height={14} />
              </button>
            </Link>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormContainer table="timetable" type="create" />
            )}
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

export default TimetableListPage;
