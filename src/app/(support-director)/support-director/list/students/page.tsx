import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { headers } from "next/headers";

type StudentList = any;

const StudentsPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const headersList = headers();
  const role = headersList.get("x-user-role") || "";
  const currentUserId = headersList.get("x-user-id") || "";
  const branchIdHeader = headersList.get("x-branch-id");
  const branchId = branchIdHeader ? parseInt(branchIdHeader) : undefined;

  const columns = [
    { header: "Info", accessor: "info" },
    { header: "Student ID", accessor: "studentId", className: "hidden md:table-cell" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Branch", accessor: "branch", className: "hidden lg:table-cell" },
    { header: "Parent", accessor: "parent", className: "hidden lg:table-cell" },
    { header: "Status", accessor: "status", className: "hidden lg:table-cell" },
    ...(role === "support_director" ? [{ header: "Actions", accessor: "action" }] : []),
  ];

  const renderRow = (item: StudentList) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.firstName} {item.lastName}</h3>
          <p className="text-xs text-gray-500">{item.phone}</p>
          <p className="text-xs text-gray-500">Born: {item.dateOfBirth.toLocaleDateString()}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{item.studentId}</span>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex flex-col">
          <span className="font-medium">{item.class.name}</span>
        </div>
      </td>
      <td className="hidden lg:table-cell"><span className="text-xs">{item.branch.shortName}</span></td>
      <td className="hidden lg:table-cell">
        <div className="flex flex-col">
          <span className="text-xs">{item.parent.firstName} {item.parent.lastName}</span>
          <span className="text-xs text-gray-500">{item.parent.phone}</span>
        </div>
      </td>
      <td className="hidden lg:table-cell">
        <span className={`px-2 py-1 rounded-full text-xs ${item.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{item.status}</span>
      </td>
      {role === "support_director" && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="student" type="update" data={item} currentUserId={currentUserId} />
            <FormContainer table="student" type="transfer" data={item} currentUserId={currentUserId} />
            <FormContainer table="student" type="resetPassword" data={item} currentUserId={currentUserId} />
            <FormContainer table="student" type="sendMessage" data={item} currentUserId={currentUserId} />
            {item.status === "ACTIVE" ? (
              <FormContainer table="student" type="archive" data={item} currentUserId={currentUserId} />
            ) : (
              <FormContainer table="student" type="restore" data={item} currentUserId={currentUserId} />
            )}
            <FormContainer table="student" type="delete" data={item} currentUserId={currentUserId} />
          </div>
        </td>
      )}
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: any = {
    ...(branchId ? { branchId } : {}),
  };

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.OR = [
              { firstName: { contains: value, mode: "insensitive" } },
              { lastName: { contains: value, mode: "insensitive" } },
              { studentId: { contains: value, mode: "insensitive" } },
              { phone: { contains: value, mode: "insensitive" } },
            ];
            break;
          case "status":
            query.status = value === "active" ? "ACTIVE" : "INACTIVE";
            break;
          case "classId":
            query.classId = parseInt(value);
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.student.findMany({
      where: query,
      include: ({ class: ({ include: { branch: true } } as unknown) as any, parent: true, branch: true } as unknown) as any,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Students</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"><Image src="/filter.png" alt="" width={14} height={14} /></button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"><Image src="/sort.png" alt="" width={14} height={14} /></button>
            {role === "support_director" && <FormContainer table="student" type="create" />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default StudentsPage;