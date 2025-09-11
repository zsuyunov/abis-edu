import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from header
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const academicYearId = url.searchParams.get("academicYearId");
    const format = url.searchParams.get("format") || "json"; // json, csv

    // Get teacher's assignments
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: userId,
      status: "ACTIVE",
      },
      include: {
        Class: true,
        Subject: true,
        Branch: true,
        AcademicYear: true,
      },
    });

    if (teacherAssignments.length === 0) {
      return NextResponse.json({ error: "No teaching assignments found" }, { status: 403 });
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
        academicYearId: parseInt(targetAcademicYearId),
        isActive: true,
        classId: { in: teacherAssignments.map(ta => ta.classId) },
      },
      include: {
        subject: true,
        class: true,
        branch: true,
        academicYear: true,
      },
          orderBy: {
        startTime: "asc",
      },
    });

    if (format === "csv") {
      // Generate CSV
      const csvRows = [
        ["Subject", "Class", "Day", "Start Time", "End Time", "Room"],
        ...timetables.map(t => [
          t.subject?.name || "Unknown",
          t.class?.name || "Unknown",
          t.dayOfWeek || "Unknown",
          t.startTime.toLocaleTimeString(),
          t.endTime.toLocaleTimeString(),
          t.roomNumber || "N/A"
        ])
      ];

      const csvContent = csvRows
        .map(row =>
          row.map((cell: any) =>
            typeof cell === "string" && (cell.includes(",") || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          ).join(",")
        )
        .join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="teacher-timetable-${userId}.csv"`
        }
      });
    }

    // Default JSON response
    return NextResponse.json({
      timetables,
      teacherAssignments,
      academicYearId: targetAcademicYearId,
    });
  } catch (error) {
    console.error("Error exporting teacher timetables:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}