import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = AuthService.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const academicYearId = searchParams.get("academicYearId");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");

    const where: any = {};
    
    if (branchId) where.branchId = parseInt(branchId);
    if (academicYearId) where.academicYearId = parseInt(academicYearId);
    if (classId) where.classId = parseInt(classId);
    if (status) where.status = status;

    const templates = await prisma.timetableTemplate.findMany({
      where,
      include: {
        branch: { select: { shortName: true, legalName: true } },
        class: { select: { name: true } },
        academicYear: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true, teacherId: true } },
      },
      orderBy: { createdAt: "desc" },
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

async function postHandler(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const data = await request.json();
    const {
      name,
      description,
      branchId,
      classId,
      academicYearId,
      subjectId,
      teacherId,
      day,
      startTime,
      endTime,
      roomNumber,
      buildingName,
      recurrenceType,
      recurrenceDays,
      recurrenceEnd,
    } = data;

    // Validate required fields
    if (!name || !branchId || !classId || !academicYearId || !subjectId || !teacherId || !day || !startTime || !endTime || !roomNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate recurrence days for CUSTOM type
    if (recurrenceType === "CUSTOM" && (!recurrenceDays || recurrenceDays.length === 0)) {
      return NextResponse.json(
        { error: "Recurrence days are required for CUSTOM type" },
        { status: 400 }
      );
    }

    // Create start and end time Date objects
    const startTimeDate = new Date(`1970-01-01T${startTime}`);
    const endTimeDate = new Date(`1970-01-01T${endTime}`);

    // Validate time range
    if (startTimeDate >= endTimeDate) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const template = await prisma.timetableTemplate.create({
      data: {
        name,
        description,
        branchId: parseInt(branchId),
        classId: parseInt(classId),
        academicYearId: parseInt(academicYearId),
        subjectId: parseInt(subjectId),
        teacherId,
        day: day as any,
        startTime: startTimeDate,
        endTime: endTimeDate,
        roomNumber,
        buildingName,
        recurrenceType: recurrenceType as any,
        recurrenceDays: recurrenceDays || [],
        recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
      },
      include: {
        branch: { select: { shortName: true, legalName: true } },
        class: { select: { name: true } },
        academicYear: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true, teacherId: true } },
      },
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

export const POST = withCSRF(postHandler);