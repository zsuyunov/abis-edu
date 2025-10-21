
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';
import { validateOwnership } from '@/middlewares/validateOwnership';

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest, _ctx?: any, locals?: { user?: { id: string; role: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const queryParams: { [key: string]: string } = {};

    // Extract all query parameters except 'page'
    for (const [key, value] of Array.from(searchParams.entries())) {
      if (key !== "page" && value) {
        queryParams[key] = value;
      }
    }

    // Build query conditions
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
          }
        }
      }
    }

    // Ownership narrowing for STUDENT/PARENT
    const user = locals?.user;
    const whereNarrow: any = { ...query };
    if (user) {
      if ((user.role || '').toUpperCase() === 'STUDENT') {
        whereNarrow.id = user.id; // student sees only themselves
      } else if ((user.role || '').toUpperCase() === 'PARENT') {
        whereNarrow.studentParents = { some: { parentId: user.id } };
      }
    }

    const [students, totalCount] = await prisma.$transaction([
      prisma.student.findMany({
        where: whereNarrow,
        include: {
          class: { include: { branch: true } },
          studentParents: { include: { parent: true } },
          branch: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.student.count({ where: whereNarrow }),
    ]);

    return NextResponse.json({
      students,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / ITEM_PER_PAGE),
    });
  } catch (error) {
    console.error("Students API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}));