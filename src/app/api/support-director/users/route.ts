import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";

const ALLOWED_POSITIONS = [
  "SUPPORT_HR",
  "SUPPORT_ADMISSION",
  "DOCTOR",
  "CHIEF",
  "SUPPORT_DIRECTOR", // can manage peers in same branch
];

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
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, count] = await Promise.all([
      prisma.user.findMany({ where, take: ITEM_PER_PAGE, skip: ITEM_PER_PAGE * (page - 1), orderBy: { createdAt: "desc" } }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({ success: true, data: users, pagination: { page, totalPages: Math.ceil(count / ITEM_PER_PAGE), totalItems: count, itemsPerPage: ITEM_PER_PAGE } });
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
    const branchId = Number(branchIdHeader);
    if (role !== "support_director" || !branchId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { firstName, lastName, phone, email, password, position } = body;
    if (!ALLOWED_POSITIONS.includes(position)) {
      return NextResponse.json({ error: "Position not allowed" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: { firstName, lastName, phone, email, position, password, branchId },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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

    // Prevent escalation to main positions
    if (data.position && !ALLOWED_POSITIONS.includes(data.position)) {
      return NextResponse.json({ error: "Position not allowed" }, { status: 400 });
    }

    const updated = await prisma.user.updateMany({ where: { id, branchId }, data });
    if (updated.count === 0) return NextResponse.json({ error: "Not found or no access" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const branchIdHeader = headersList.get("x-branch-id");
    if (role !== "support_director") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const branchId = Number(branchIdHeader);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const archived = await prisma.user.updateMany({ where: { id, branchId }, data: { archivedAt: new Date() } });
    if (archived.count === 0) return NextResponse.json({ error: "Not found or no access" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const branchIdHeader = headersList.get("x-branch-id");
    if (role !== "support_director") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const branchId = Number(branchIdHeader);

    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const restored = await prisma.user.updateMany({ where: { id, branchId }, data: { archivedAt: null } });
    if (restored.count === 0) return NextResponse.json({ error: "Not found or no access" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


