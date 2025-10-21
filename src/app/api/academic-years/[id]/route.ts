import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // Basic auth check
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const params = context.params;
  try {
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        semesters: {
          orderBy: { startDate: "asc" }
        }
      }
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: "Academic year not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ academicYear });
  } catch (error) {
    console.error("Failed to fetch academic year:", error);
    return NextResponse.json(
      { error: "Failed to fetch academic year" },
      { status: 500 }
    );
  }
}

async function putHandler(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = context.params;
  try {
    const body = await request.json();
    const { name, startDate, endDate, isCurrent, semesters } = body;
    const academicYearId = parseInt(params.id);

    // If this is being set as current, remove current flag from others
    if (isCurrent) {
      await prisma.academicYear.updateMany({
        where: { 
          isCurrent: true,
          id: { not: academicYearId }
        },
        data: { isCurrent: false }
      });
    }

    // Delete existing semesters and recreate them
    await prisma.semester.deleteMany({
      where: { academicYearId }
    });

    const academicYear = await prisma.academicYear.update({
      where: { id: academicYearId },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: isCurrent || false,
        semesters: {
          create: semesters.map((semester: any) => ({
            name: semester.name,
            startDate: new Date(semester.startDate),
            endDate: new Date(semester.endDate)
          }))
        }
      },
      include: {
        semesters: {
          orderBy: { startDate: "asc" }
        }
      }
    });

    return NextResponse.json({ academicYear });
  } catch (error) {
    console.error("Failed to update academic year:", error);
    return NextResponse.json(
      { error: "Failed to update academic year" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // Basic auth check
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return putHandler(request, context);
}
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // Basic auth check
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return deleteHandler(request, context);
}

async function deleteHandler(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { comment, createdBy } = body;
    const academicYearId = parseInt(context.params.id);

    // Check if academic year is being used by classes
    const classCount = await prisma.class.count({
      where: { academicYearId }
    });

    if (classCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete academic year that is being used by classes" },
        { status: 400 }
      );
    }

    // Create archive comment
    await prisma.archiveComment.create({
      data: {
        academicYearId,
        comment,
        action: "DELETE",
        createdBy
      }
    });

    // Delete the academic year (will cascade delete semesters)
    await prisma.academicYear.delete({
      where: { id: academicYearId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete academic year:", error);
    return NextResponse.json(
      { error: "Failed to delete academic year" },
      { status: 500 }
    );
  }
}
