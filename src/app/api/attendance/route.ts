import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { timetableId, classId, subjectId, date, attendance } = await request.json();

    // Validate required fields
    if (!timetableId || !classId || !subjectId || !date || !attendance || !Array.isArray(attendance)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify teacher has access to this class and subject
    const teacherAssignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacherId,
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        role: 'TEACHER'
      }
    });

    if (!teacherAssignment) {
      return NextResponse.json({ error: "Unauthorized access to this class/subject" }, { status: 403 });
    }

    // Get timetable details for additional fields
    const timetable = await prisma.timetable.findUnique({
      where: { id: parseInt(timetableId) },
      select: { academicYearId: true, branchId: true }
    });

    if (!timetable) {
      return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    }

    // Validate and filter attendance records
    const validAttendance = attendance.filter(record => 
      record && 
      typeof record.studentId === 'number' && 
      !isNaN(record.studentId) && 
      typeof record.status === 'string' && 
      record.status.trim() !== ''
    );

    if (validAttendance.length === 0) {
      return NextResponse.json({ error: "No valid attendance records provided" }, { status: 400 });
    }

    // Save attendance records
    const attendanceRecords = await Promise.all(
      validAttendance.map(async (record: { studentId: number; status: string }) => {
        try {
          // First, try to find existing record
          const existing = await prisma.attendance.findFirst({
            where: {
              studentId: record.studentId.toString(),
              classId: parseInt(classId),
              subjectId: parseInt(subjectId),
              date: new Date(date)
            }
          });

          if (existing) {
            // Update existing record
            return prisma.attendance.update({
              where: { id: existing.id },
              data: {
                status: record.status as 'PRESENT' | 'ABSENT' | 'LATE',
                updatedAt: new Date()
              }
            });
          } else {
            // Create new record
            return prisma.attendance.create({
              data: {
                studentId: record.studentId.toString(),
                classId: parseInt(classId),
                subjectId: parseInt(subjectId),
                date: new Date(date),
                status: record.status as 'PRESENT' | 'ABSENT' | 'LATE',
                teacherId: teacherId,
                timetableId: parseInt(timetableId),
                academicYearId: timetable.academicYearId,
                branchId: timetable.branchId
              }
            });
          }
        } catch (error) {
          console.error(`Error saving attendance for student ${record.studentId}:`, error);
          throw error;
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: "Attendance saved successfully",
      data: {
        count: attendanceRecords.length,
        date: date
      }
    });

  } catch (error) {
    console.error("Error saving attendance:", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}