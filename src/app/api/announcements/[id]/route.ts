import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    const announcement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcement" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    const {
      title,
      description,
      date,
      targetAudience,
      isAllBranches,
      branchIds,
      classIds,
      userIds,
      studentIds,
      teacherIds,
      parentIds
    } = body;

    // Update the announcement
    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        description,
        date: new Date(date),
        targetAudience,
        isAllBranches: isAllBranches ?? true,
        branchIds: branchIds || [],
        classIds: classIds || [],
        userIds: userIds || [],
        studentIds: studentIds || [],
        teacherIds: teacherIds || [],
        parentIds: parentIds || []
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // Delete the announcement
    await prisma.announcement.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
