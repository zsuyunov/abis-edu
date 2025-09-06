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
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [classes, count] = await Promise.all([
      prisma.class.findMany({ 
        where, 
        include: { 
          branch: { select: { shortName: true } },
          academicYear: { select: { year: true } },
          supervisor: { select: { firstName: true, lastName: true } }
        }, 
        take: ITEM_PER_PAGE, 
        skip: ITEM_PER_PAGE * (page - 1), 
        orderBy: { createdAt: "desc" } 
      }),
      prisma.class.count({ where })
    ]);

    return NextResponse.json({ classes, totalPages: Math.ceil(count / ITEM_PER_PAGE), currentPage: page, totalItems: count });
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
    const { name, capacity, academicYearId, language, educationType, supervisorId } = await request.json();
    const row = await prisma.class.create({ 
      data: { 
        name, 
        capacity: capacity || 30, 
        branchId, 
        academicYearId: academicYearId || 1,
        language: language || 'UZBEK',
        educationType: educationType || 'GENERAL',
        supervisorId 
      } 
    });
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
    const { id, ...data } = await request.json();
    const updated = await prisma.class.updateMany({ where: { id, branchId }, data });
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
    const archived = await prisma.class.updateMany({ where: { id, branchId }, data: { archivedAt: new Date() } });
    if (archived.count === 0) return NextResponse.json({ error: 'Not found or no access' }, { status: 404 });
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
    const restored = await prisma.class.updateMany({ where: { id, branchId }, data: { archivedAt: null } });
    if (restored.count === 0) return NextResponse.json({ error: 'Not found or no access' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}


