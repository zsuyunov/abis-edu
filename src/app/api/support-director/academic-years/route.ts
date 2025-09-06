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
    const search = searchParams.get("search") || "";

    const where: any = {
      classes: { some: { branchId } },
    };
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [rows, count] = await Promise.all([
      prisma.academicYear.findMany({ where, take: ITEM_PER_PAGE, skip: ITEM_PER_PAGE * (page - 1), orderBy: { createdAt: "desc" } }),
      prisma.academicYear.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: rows, pagination: { page, totalPages: Math.ceil(count / ITEM_PER_PAGE), totalItems: count, itemsPerPage: ITEM_PER_PAGE } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// AcademicYear CRUD may be restricted in some orgs; providing restore/archive helpers for branch relations
export async function PATCH(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    if (role !== "support_director") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id, name } = await request.json();
    const updated = await prisma.academicYear.update({ where: { id }, data: { name } });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}


