import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const branchIdHeader = headersList.get("x-branch-id");
    if (role !== "support_director") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const branchId = Number(branchIdHeader);
    if (!branchId) return NextResponse.json({ error: "Branch not assigned" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const classId = searchParams.get("classId");

    const where: any = { branchId };
    if (classId) where.classId = Number(classId);

    const [rows, count] = await Promise.all([
      prisma.attendance.findMany({ where, include: { student: { select: { firstName: true, lastName: true } }, class: true }, take: ITEM_PER_PAGE, skip: ITEM_PER_PAGE * (page - 1), orderBy: { date: "desc" } }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: rows, pagination: { page, totalPages: Math.ceil(count / ITEM_PER_PAGE), totalItems: count, itemsPerPage: ITEM_PER_PAGE } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


