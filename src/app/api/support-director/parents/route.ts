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

    const where: any = { branchId };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [parents, count] = await Promise.all([
      prisma.parent.findMany({
        where,
        include: {
          branch: true,
          studentParents: {
            include: { student: { select: { firstName: true, lastName: true, class: { select: { name: true } } } } }
          }
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
        orderBy: { createdAt: "desc" },
      }),
      prisma.parent.count({ where }),
    ]);

    return NextResponse.json({ parents, totalPages: Math.ceil(count / ITEM_PER_PAGE), currentPage: page, totalItems: count });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const branchIdHeader = headersList.get("x-branch-id");
    if (role !== "support_director") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const branchId = Number(branchIdHeader);
    const body = await request.json();
    const row = await prisma.parent.create({ data: { ...body, branchId } });
    return NextResponse.json({ success: true, data: row });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const branchIdHeader = headersList.get("x-branch-id");
    if (role !== "support_director") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const branchId = Number(branchIdHeader);
    const body = await request.json();
    const { id, ...data } = body;
    const updated = await prisma.parent.updateMany({ where: { id, branchId }, data });
    if (updated.count === 0) return NextResponse.json({ error: 'Not found or no access' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const branchIdHeader = headersList.get("x-branch-id");
    if (role !== "support_director") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const branchId = Number(branchIdHeader);
    const id = Number(new URL(request.url).searchParams.get('id'));
    const deleted = await prisma.parent.updateMany({ where: { id, branchId }, data: { archivedAt: new Date() } });
    if (deleted.count === 0) return NextResponse.json({ error: 'Not found or no access' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const branchIdHeader = headersList.get("x-branch-id");
    if (role !== "support_director") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const branchId = Number(branchIdHeader);
    const { id } = await request.json();
    const restored = await prisma.parent.updateMany({ where: { id, branchId }, data: { archivedAt: null } });
    if (restored.count === 0) return NextResponse.json({ error: 'Not found or no access' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}


