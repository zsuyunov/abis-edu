import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Use header-based authentication
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId") || userId;
    const academicYearId = url.searchParams.get("academicYearId");
    const format = url.searchParams.get("format") || "json"; // json, csv, pdf

    // Get student information
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            academicYear: true,
            branch: true,
          },
        },
        branch: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (!student.classId) {
      return NextResponse.json({ error: "Student class information is missing" }, { status: 400 });
    }

    // Verify access
    if (userId !== studentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get academic year
    let targetAcademicYearId = academicYearId;
    if (!targetAcademicYearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { isCurrent: true, status: "ACTIVE" },
      });
      targetAcademicYearId = currentYear?.id?.toString() || null;
    }

    if (!targetAcademicYearId) {
      return NextResponse.json({ error: "No academic year available" }, { status: 404 });
    }

    // Get timetables
    const timetables = await prisma.timetable.findMany({
      where: {
      classId: student.classId,
        academicYearId: parseInt(targetAcademicYearId),
        isActive: true,
      },
      include: {
        subject: true,
          },
          orderBy: {
        startTime: "asc",
      },
    });

    if (format === "csv") {
      // Generate CSV
      const csvRows = [
        ["Subject", "Day", "Start Time", "End Time", "Room"],
        ...timetables.map(t => [
          t.subject?.name || "Unknown",
          t.dayOfWeek || "Unknown",
          t.startTime.toLocaleTimeString(),
          t.endTime.toLocaleTimeString(),
          t.roomNumber || "N/A"
        ])
      ];

      const csvContent = csvRows
        .map(row =>
          row.map(cell =>
            typeof cell === "string" && (cell.includes(",") || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          ).join(",")
        )
        .join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="timetable-${student.firstName}-${student.lastName}.csv"`
        }
      });
    }

    // Default JSON response
    return NextResponse.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        class: student.class || null,
        branch: student.branch || null,
      },
      timetables,
      academicYearId: targetAcademicYearId,
    });
  } catch (error) {
    console.error("Error exporting student timetables:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}