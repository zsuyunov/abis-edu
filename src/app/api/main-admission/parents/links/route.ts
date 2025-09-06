import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    if (role !== "main_admission") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { parentId, links, branchId } = await request.json();
    if (!parentId || !Array.isArray(links) || !branchId) return NextResponse.json({ error: "parentId, branchId and links required" }, { status: 400 });

    // Verify parent belongs to provided branch
    const parent = await prisma.parent.findFirst({ where: { id: parentId, branchId: parseInt(branchId) }, select: { id: true } });
    if (!parent) return NextResponse.json({ error: "Parent not found or not in branch" }, { status: 404 });

    const studentIds = links.map((l: any) => l.studentId);
    const students = await prisma.student.findMany({ where: { id: { in: studentIds }, branchId: parseInt(branchId) }, select: { id: true } });
    const allowedIds = new Set(students.map(s => s.id));
    const data = links.filter((l: any) => allowedIds.has(l.studentId)).map((l: any) => ({
      studentId: l.studentId,
      parentId,
      relationship: l.relationship,
    }));
    if (!data.length) return NextResponse.json({ success: true, created: 0 });

    const result = await prisma.studentParent.createMany({ data, skipDuplicates: true });
    return NextResponse.json({ success: true, created: result.count });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    if (role !== "main_admission") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { parentId, studentId, relationship, branchId } = await request.json();
    if (!parentId || !studentId || !branchId) return NextResponse.json({ error: "parentId, studentId and branchId required" }, { status: 400 });

    const [parent, student] = await Promise.all([
      prisma.parent.findFirst({ where: { id: parentId, branchId: parseInt(branchId) }, select: { id: true } }),
      prisma.student.findFirst({ where: { id: studentId, branchId: parseInt(branchId) }, select: { id: true } }),
    ]);
    if (!parent || !student) return NextResponse.json({ error: "Not found or cross-branch" }, { status: 404 });

    const deleted = await prisma.studentParent.deleteMany({ where: { parentId, studentId, ...(relationship ? { relationship } : {}) } });
    return NextResponse.json({ success: true, deleted: deleted.count });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}


