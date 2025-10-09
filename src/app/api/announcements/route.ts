import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
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
      parentIds,
      createdBy
    } = body;

    // Create the announcement
    const announcement = await prisma.announcement.create({
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
        parentIds: parentIds || [],
        createdBy: createdBy || "system"
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}

export const POST = withCSRF(postHandler);
