import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
      record.studentId && 
      typeof record.points === 'number' && 
      !isNaN(record.points) &&
      record.points > 0
    );

    if (validGrades.length === 0) {
      return NextResponse.json({ error: "No valid grade records provided" }, { status: 400 });
    }

    // Save grade records
    const gradeRecords = await Promise.all(
      validGrades.map(async (record: { studentId: string; points: number; comments?: string }) => {
        try {
          // First, try to find existing record
          const existing = await prisma.grade.findFirst({
            where: {
              studentId: record.studentId,
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
                description: record.comments || null,
                updatedAt: new Date()
              }
            });
          } else {
            // Create new record
            return prisma.grade.create({
              data: {
                studentId: record.studentId,
                classId: parseInt(classId),
                subjectId: parseInt(subjectId),
                date: new Date(date),
                value: record.points,
                description: record.comments || null,
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
  }
}

export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timetableId = searchParams.get('timetableId');
    const date = searchParams.get('date');
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const month = searchParams.get('month');
    const academicYearId = searchParams.get('academicYearId');
    const branchId = searchParams.get('branchId');

    // Build where clause based on available parameters
    let whereClause: any = {
      teacherId: teacherId
    };

    if (timetableId && date) {
      // Specific timetable and date
      whereClause.timetableId = parseInt(timetableId);
      whereClause.date = new Date(date);
    } else if (classId && subjectId && month) {
      // Class, subject, and month range
      whereClause.classId = parseInt(classId);
      whereClause.subjectId = parseInt(subjectId);
      
      // Create date range for the month
      const monthStart = new Date(month + '-01');
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Last day of the month
      
      whereClause.date = {
        gte: monthStart,
        lte: monthEnd
      };
    } else {
      return NextResponse.json({ 
        error: "Either timetableId+date or classId+subjectId+month are required" 
      }, { status: 400 });
    }

    if (academicYearId) {
      whereClause.academicYearId = parseInt(academicYearId);
    }
    if (branchId) {
      whereClause.branchId = parseInt(branchId);
    }

    // Fetch grades based on the where clause
    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true
          }
        },
        timetable: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            subject: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        student: {
          firstName: 'asc'
        }
      }
    });

    return NextResponse.json({
      success: true,
      grades: grades.map(grade => ({
        id: grade.id,
        date: grade.date,
        value: grade.value,
        description: grade.description,
        studentId: grade.studentId,
        student: grade.student,
        timetable: grade.timetable
      }))
    });

  } catch (error) {
    console.error("Error fetching grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}

// PUT method for updating individual grades
export async function PUT(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gradeId, value, description } = body;

    if (!gradeId || value === undefined || value === null) {
      return NextResponse.json({ 
        error: "Grade ID and value are required" 
      }, { status: 400 });
    }

    if (value < 1 || value > 100) {
      return NextResponse.json({ 
        error: "Grade must be between 1 and 100" 
      }, { status: 400 });
    }

    // Update the grade
    const updatedGrade = await prisma.grade.update({
      where: {
        id: gradeId,
        teacherId: teacherId // Ensure teacher can only update their own grades
      },
      data: {
        value: value,
        description: description || null,
        updatedAt: new Date()
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      grade: updatedGrade
    });

  } catch (error) {
    console.error("Error updating grade:", error);
    return NextResponse.json(
      { error: "Failed to update grade" },
      { status: 500 }
    );
  }
}