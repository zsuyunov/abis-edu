import prisma from "@/lib/prisma";
import { Class, Prisma, Subject, Teacher, TeacherPassport, TeacherEducation, Branch } from "@prisma/client";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { headers } from "next/headers";
import TeachersListContent from "@/components/TeachersListContent";

type TeacherList = Teacher & { 
  subjects: Subject[]; 
  classes: Class[]; 
  passport?: TeacherPassport; 
  education?: TeacherEducation;
  branch?: Branch;
};

const TeacherListPage = async ({
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
      header: "Status",
      accessor: "status",
      className: "hidden md:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Address",
      accessor: "address",
      className: "hidden lg:table-cell",
    },
    {
      header: "Assignment Status",
      accessor: "assignmentStatus",
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

  const renderRow = (item: TeacherList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-gray-50 text-sm hover:bg-blue-50 transition-colors duration-150"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src="/noAvatar.png"
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold text-gray-900">{item.firstName} {item.lastName}</h3>
          <p className="text-xs text-gray-500">ID: {item.teacherId}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      </td>
      <td className="hidden lg:table-cell text-gray-900">{item.phone}</td>
      <td className="hidden lg:table-cell text-gray-900">{item.address}</td>
              <td className="hidden lg:table-cell">
          {item.TeacherAssignment.length > 0 ? (
            <div className="flex flex-col gap-1">
              {item.TeacherAssignment.map((assignment: any, index: number) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    assignment.role === "SUPERVISOR"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {assignment.role === "SUPERVISOR" ? "Assigned as Supervisor" : "Assigned as Teacher"}
                </span>
              ))}
            </div>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Unassigned
            </span>
          )}
        </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/admin/list/teachers/${item.id}`}>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-200 active:scale-95">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && (
            <>
              <FormContainer table="teacher" type="update" data={item} currentUserId={currentUserId} />
              <FormContainer table="teacherAssignment" type="assign" data={item} />
              <FormContainer table="teacher" type="resetPassword" data={item} currentUserId={currentUserId} />
              <FormContainer table="teacher" type="sendMessage" data={item} currentUserId={currentUserId} />
              {item.status === "ACTIVE" ? (
                <TeacherActionModal
                  table="teacher"
                  type="archive"
                  data={item}
                  currentUserId={currentUserId}
                />
              ) : (
                <TeacherActionModal
                  table="teacher"
                  type="restore"
                  data={item}
                  currentUserId={currentUserId}
                />
              )}
              <TeacherDeleteModal
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

  const query: Prisma.TeacherWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.timetables = {
              some: {
                classId: parseInt(value),
              },
            };
            break;
          case "search":
            query.OR = [
              { firstName: { contains: value, mode: "insensitive" } },
              { lastName: { contains: value, mode: "insensitive" } },
              { email: { contains: value, mode: "insensitive" } },
              { phone: { contains: value, mode: "insensitive" } },
              { address: { contains: value, mode: "insensitive" } },
            ];
            break;
          case "assignmentStatus":
            if (value === "assigned") {
              query.TeacherAssignment = { some: {} };
            } else if (value === "unassigned") {
              query.TeacherAssignment = { none: {} };
            }
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.teacher.findMany({
      where: query,
      include: {
        passport: true,
        education: true,
        TeacherAssignment: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.teacher.count({ where: query }),
  ]);

  return (
    <TeachersListContent 
      data={data} 
      count={count} 
      page={p} 
      role={role} 
      currentUserId={currentUserId} 
    />
  );
};

export default TeacherListPage;
