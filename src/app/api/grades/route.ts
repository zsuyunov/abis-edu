import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Grades API received data:", body);
    
    const { timetableId, classId, subjectId, date, grades } = body;

    // Validate required fields
    if (!timetableId || !classId || !subjectId || !date || !grades || !Array.isArray(grades)) {
      console.log("Validation failed:", { timetableId, classId, subjectId, date, grades: Array.isArray(grades) });
      return NextResponse.json({ 
        error: "Missing required fields", 
        details: { timetableId, classId, subjectId, date, grades: Array.isArray(grades) }
      }, { status: 400 });
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

    // Get current year and month for grade record
    const currentDate = new Date(date);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // Validate and filter grade records
    const validGrades = grades.filter(record => 
      record && 
      typeof record.studentId === 'number' && 
      !isNaN(record.studentId) && 
      typeof record.points === 'number' && 
      !isNaN(record.points)
    );

    if (validGrades.length === 0) {
      return NextResponse.json({ error: "No valid grade records provided" }, { status: 400 });
    }

    // Save grade records
    const gradeRecords = await Promise.all(
      validGrades.map(async (record: { studentId: number; points: number }) => {
        try {
          // First, try to find existing record
          const existing = await prisma.grade.findFirst({
            where: {
              studentId: record.studentId.toString(),
              classId: parseInt(classId),
              subjectId: parseInt(subjectId),
              date: new Date(date)
            }
          });

          if (existing) {
            // Update existing record
            return prisma.grade.update({
              where: { id: existing.id },
              data: {
                value: record.points,
                updatedAt: new Date()
              }
            });
          } else {
            // Create new record
            return prisma.grade.create({
              data: {
                studentId: record.studentId.toString(),
                classId: parseInt(classId),
                subjectId: parseInt(subjectId),
                date: new Date(date),
                value: record.points,
                teacherId: teacherId,
                timetableId: parseInt(timetableId),
                academicYearId: timetable.academicYearId,
                branchId: timetable.branchId,
                year: year,
                month: month,
                type: 'DAILY' // Default grade type
              }
            });
          }
        } catch (error) {
          console.error(`Error saving grade for student ${record.studentId}:`, error);
          throw error;
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: "Grades saved successfully",
      data: {
        count: gradeRecords.length,
        date: date
      }
    });

  } catch (error) {
    console.error("Error saving grades:", error);
    return NextResponse.json(
      { error: "Failed to save grades" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}