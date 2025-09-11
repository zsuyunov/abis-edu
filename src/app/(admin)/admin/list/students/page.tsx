import StudentListClient from "@/components/StudentListClient";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";

const StudentListPage = async ({
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
  const query: any = {};

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
          case "branchId":
            query.branchId = parseInt(value);
            break;
          case "classId":
            query.classId = parseInt(value);
            break;
          case "assignmentStatus":
            if (value === "assigned") {
              query.classId = { not: null };
            } else if (value === "unassigned") {
              query.classId = null;
            }
            break;
          // grade removed
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.student.findMany({
      where: query,
      include: {
        class: { include: { branch: true } },
        studentParents: { include: { parent: true } },
        branch: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.student.count({ where: query }),
  ]);

  return (
    <StudentListClient
      initialData={data}
      totalCount={count}
      currentPage={p}
      role={role}
      currentUserId={currentUserId}
    />
  );
};

export default StudentListPage;