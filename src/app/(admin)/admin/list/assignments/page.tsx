import { Suspense } from "react";
import Image from "next/image";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainer from "@/components/FormContainer";
import { ITEM_PER_PAGE } from "@/lib/settings";
import prisma from "@/lib/prisma";

type HomeworkList = {
  id: number;
  title: string;
  description: string;
  dueDate: Date;
  subject: {
    name: string;
  };
  teacher: {
    firstName: string;
    lastName: string;
  };
  class: {
    name: string;
  };
  _count: {
    submissions: number;
  };
};

const HomeworkListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: any = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.OR = [
              { title: { contains: value, mode: "insensitive" } },
              { description: { contains: value, mode: "insensitive" } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.homework.findMany({
      where: query,
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: {
        dueDate: "desc",
      },
    }),
    prisma.homework.count({ where: query }),
  ]);

  const columns = [
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Subject",
      accessor: "subject",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden lg:table-cell",
    },
    {
      header: "Due Date",
      accessor: "dueDate",
      className: "hidden lg:table-cell",
    },
    {
      header: "Submissions",
      accessor: "submissions",
      className: "hidden lg:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const renderRow = (item: HomeworkList) => (
    <tr key={item.id}>
      <td className="px-4 py-2">{item.title}</td>
      <td className="px-4 py-2 hidden md:table-cell">{item.subject.name}</td>
      <td className="px-4 py-2 hidden md:table-cell">
        {item.teacher.firstName} {item.teacher.lastName}
      </td>
      <td className="px-4 py-2 hidden lg:table-cell">{item.class.name}</td>
      <td className="px-4 py-2 hidden lg:table-cell">
        {new Date(item.dueDate).toLocaleDateString()}
      </td>
      <td className="px-4 py-2 hidden lg:table-cell">{item._count.submissions}</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <FormContainer table="homework" type="view" id={item.id} />
          <FormContainer table="homework" type="edit" id={item.id} />
          <FormContainer table="homework" type="delete" id={item.id} />
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Homework</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <FormContainer table="homework" type="create" />
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

export default HomeworkListPage;
