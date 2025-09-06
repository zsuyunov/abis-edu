import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

class AuthService {
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  static verifyToken(token: string): { id: string; user?: any } | null {
    try {
      const session = auth(token);
      return session;
    } catch (error) {
      return null;
    }
  }
}

// GET - Fetch timetable templates
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const branchId = url.searchParams.get("branchId");
    const classId = url.searchParams.get("classId");
    const academicYearId = url.searchParams.get("academicYearId");
    const teacherId = url.searchParams.get("teacherId");
    const status = url.searchParams.get("status");

    const where: any = {};
    if (branchId) where.branchId = parseInt(branchId);
    if (classId) where.classId = parseInt(classId);
    if (academicYearId) where.academicYearId = parseInt(academicYearId);
    if (teacherId) where.teacherId = teacherId;
    if (status) where.status = status;

    const templates = await prisma.timetableTemplate.findMany({
      where,
      include: {
        branch: { select: { shortName: true } },
        class: { select: { name: true } },
        academicYear: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
        _count: { select: { timetables: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(templates);

  } catch (error) {
    console.error("Error fetching timetable templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable templates" },
      { status: 500 }
    );
  }
}

// POST - Create new timetable template
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      branchId,
      classId,
      academicYearId,
      subjectId,
      teacherId,
      days,
      startTime,
      endTime,
      roomNumber,
      buildingName,
      recurrenceType,
      startDate,
      endDate,
      excludeDates
    } = body;

    // Validate required fields
    if (!name || !branchId || !classId || !academicYearId || !subjectId || !teacherId || 
        !days || days.length === 0 || !startTime || !endTime || !roomNumber || 
        !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for time conflicts with existing templates
    const conflictCheck = await prisma.timetableTemplate.findMany({
      where: {
        branchId: parseInt(branchId),
        classId: parseInt(classId),
        academicYearId: parseInt(academicYearId),
        status: "ACTIVE",
        days: { hasSome: days },
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } }
            ]
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } }
            ]
          },
          {
            AND: [
              { startTime: { gte: new Date(startTime) } },
              { endTime: { lte: new Date(endTime) } }
            ]
          }
        ]
      }
    });

    if (conflictCheck.length > 0) {
      return NextResponse.json(
        { error: "Time conflict detected with existing template" },
        { status: 409 }
      );
    }

    // Create the template
    const template = await prisma.timetableTemplate.create({
      data: {
        name,
        branchId: parseInt(branchId),
        classId: parseInt(classId),
        academicYearId: parseInt(academicYearId),
        subjectId: parseInt(subjectId),
        teacherId,
        days,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        roomNumber,
        buildingName,
        recurrenceType: recurrenceType || "WEEKLY",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        excludeDates: excludeDates ? excludeDates.map((date: string) => new Date(date)) : [],
        createdBy: session.id
      },
      include: {
        branch: { select: { shortName: true } },
        class: { select: { name: true } },
        academicYear: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } }
      }
    });

    return NextResponse.json(template, { status: 201 });

  } catch (error) {
    console.error("Error creating timetable template:", error);
    return NextResponse.json(
      { error: "Failed to create timetable template" },
      { status: 500 }
    );
  }
}

// PUT - Update timetable template
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Check if template exists
    const existingTemplate = await prisma.timetableTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Update the template
    const updatedTemplate = await prisma.timetableTemplate.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        startTime: updateData.startTime ? new Date(updateData.startTime) : undefined,
        endTime: updateData.endTime ? new Date(updateData.endTime) : undefined,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        excludeDates: updateData.excludeDates ? 
          updateData.excludeDates.map((date: string) => new Date(date)) : undefined,
        updatedAt: new Date()
      },
      include: {
        branch: { select: { shortName: true } },
        class: { select: { name: true } },
        academicYear: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } }
      }
    });

    return NextResponse.json(updatedTemplate);

  } catch (error) {
    console.error("Error updating timetable template:", error);
    return NextResponse.json(
      { error: "Failed to update timetable template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete timetable template
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Check if template exists and has generated timetables
    const template = await prisma.timetableTemplate.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { timetables: true } } }
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template._count.timetables > 0) {
      // If template has generated timetables, just mark as inactive
      await prisma.timetableTemplate.update({
        where: { id: parseInt(id) },
        data: { status: "INACTIVE" }
      });
    } else {
      // If no timetables generated, can safely delete
      await prisma.timetableTemplate.delete({
        where: { id: parseInt(id) }
      });
    }

    return NextResponse.json({ message: "Template deleted successfully" });

  } catch (error) {
    console.error("Error deleting timetable template:", error);
    return NextResponse.json(
      { error: "Failed to delete timetable template" },
      { status: 500 }
    );
  }
}
