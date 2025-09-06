import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const branchIdHeader = headersList.get("x-branch-id");
    const userId = headersList.get("x-user-id");
    if (role !== "support_director") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const branchId = Number(branchIdHeader);
    if (!branchId) return NextResponse.json({ error: "Branch not assigned" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";

    const where: any = { branchId, OR: [{ senderId: userId }, { receiverId: userId }] };
    if (search) where.text = { contains: search, mode: "insensitive" };

    const [rows, count] = await Promise.all([
      prisma.message.findMany({ where, include: { sender: true, receiver: true }, take: ITEM_PER_PAGE, skip: ITEM_PER_PAGE * (page - 1), orderBy: { createdAt: "desc" } }),
      prisma.message.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: rows, pagination: { page, totalPages: Math.ceil(count / ITEM_PER_PAGE), totalItems: count, itemsPerPage: ITEM_PER_PAGE } });
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
    const userId = headersList.get("x-user-id");
    if (role !== "support_director") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const branchId = Number(branchIdHeader);
    if (!branchId) return NextResponse.json({ error: "Branch not assigned" }, { status: 400 });

    const body = await request.json();
    const { receiverId, text } = body;
    if (!receiverId || !text) return NextResponse.json({ error: "Receiver and text required" }, { status: 400 });

    const row = await prisma.message.create({ data: { senderId: userId!, receiverId, text, branchId } });
    return NextResponse.json({ success: true, data: row });
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
    const userId = headersList.get("x-user-id");
    if (role !== "support_director") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const branchId = Number(branchIdHeader);
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const deleted = await prisma.message.deleteMany({ where: { id, branchId, senderId: userId } });
    if (deleted.count === 0) return NextResponse.json({ error: "Not found or no access" }, { status: 404 });
    return NextResponse.json({ success: true });
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
    const userId = headersList.get("x-user-id");
    if (role !== "support_director") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const branchId = Number(branchIdHeader);
    const body = await request.json();
    const { id, text } = body;
    if (!id || !text) return NextResponse.json({ error: "id and text required" }, { status: 400 });
    const updated = await prisma.message.updateMany({ where: { id, branchId, senderId: userId }, data: { text } });
    if (updated.count === 0) return NextResponse.json({ error: "Not found or no access" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


