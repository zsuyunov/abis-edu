import TeacherListClient from "@/components/TeacherListClient";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { headers } from "next/headers";

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const headersList = headers();
  const role = headersList.get("x-user-role") || "";
  const currentUserId = headersList.get("x-user-id") || "";
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.TeacherWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "branchId":
            query.TeacherAssignment = {
              some: {
                branchId: parseInt(value),
              },
            };
            break;
          case "classId":
            query.TeacherAssignment = {
              some: {
                classId: parseInt(value),
              },
            };
            break;
          case "search":
            query.OR = [
              { firstName: { contains: value, mode: "insensitive" } },
              { lastName: { contains: value, mode: "insensitive" } },
              { teacherId: { contains: value, mode: "insensitive" } },
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
        TeacherAssignment: {
          include: {
            Branch: true,
          },
        },
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
    <TeacherListClient
      initialData={data}
      totalCount={count}
      currentPage={p}
      role={role}
      currentUserId={currentUserId}
    />
  );
};

export default TeacherListPage;
