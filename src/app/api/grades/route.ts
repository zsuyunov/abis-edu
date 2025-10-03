import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    if (!teacherId) {
      console.log('❌ Unauthorized: No teacher ID provided');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const { studentId, classId, subjectId, date, value, description, timetableId: incomingTimetableId, grades } = body;

    // Check if this is a single grade record or bulk grades
    if (studentId && classId && subjectId && date && value !== undefined) {
      // Single grade record
      console.log('📝 Processing single grade record');

      // Validate grade value
      if (value < 0 || value > 100) {
        console.log('❌ Invalid grade value:', value);
        return NextResponse.json({
          error: "Invalid grade value. Must be between 0 and 100"
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
        console.log('❌ Unauthorized access to this class/subject');
        return NextResponse.json({ error: "Unauthorized access to this class/subject" }, { status: 403 });
      }

      // Check if grade record already exists
      const existing = await prisma.grade.findFirst({
        where: {
          studentId: studentId.toString(),
          classId: parseInt(classId),
          subjectId: parseInt(subjectId),
          date: new Date(date)
        }
      });

      let gradeRecord;
      if (existing) {
        console.log(`📝 Updating existing grade record (ID: ${existing.id})`);
        gradeRecord = await prisma.grade.update({
          where: { id: existing.id },
          data: {
            value: value,
            description: description || null,
            teacherId: teacherId,
            updatedAt: new Date()
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
      } else {
        console.log(`➕ Creating new grade record for student ${studentId}`);
        
        // Grades no longer depend on timetables - can be created independently

        // Get current year and month for grade record
        const currentDate = new Date(date);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        // Find a valid timetable ID to use
        const validTimetable = await prisma.timetable.findFirst({
          where: {
            isActive: true,
            classId: parseInt(classId),
            subjectId: parseInt(subjectId)
          },
          select: { id: true }
        });

        if (!validTimetable) {
          console.log('❌ No valid timetable found for class and subject');
          return NextResponse.json({ 
            error: "No valid timetable found for the specified class and subject" 
          }, { status: 400 });
        }

        console.log('✅ Using timetable ID for grade:', validTimetable.id);

        // Create grade record with valid timetable ID
        gradeRecord = await prisma.grade.create({
          data: {
            studentId: studentId.toString(),
            classId: parseInt(classId),
            subjectId: parseInt(subjectId),
            date: new Date(date),
            value: value,
            description: description || null,
            teacherId: teacherId,
            timetableId: validTimetable.id, // Use actual timetable ID
            academicYearId: 1, // Default academic year
            branchId: 1, // Default branch
            year: year,
            month: month,
            type: 'DAILY' // Default grade type
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
      }

      console.log('✅ Grade saved successfully:', gradeRecord.id);
      return NextResponse.json({ 
        success: true, 
        message: "Grade saved successfully",
        data: gradeRecord
      });
    }

    // Bulk grades (legacy support)
    const { timetableId, classId: bulkClassId, subjectId: bulkSubjectId, date: bulkDate, grades: bulkGrades } = body;

    // Validate required fields for bulk
    if (!timetableId || !bulkClassId || !bulkSubjectId || !bulkDate || !bulkGrades || !Array.isArray(bulkGrades)) {
      console.log("Validation failed:", { timetableId, bulkClassId, bulkSubjectId, bulkDate, grades: Array.isArray(bulkGrades) });
      return NextResponse.json({ 
        error: "Missing required fields", 
        details: { timetableId, bulkClassId, bulkSubjectId, bulkDate, grades: Array.isArray(bulkGrades) }
      }, { status: 400 });
    }

    // Verify teacher has access to this class and subject
    const teacherAssignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacherId,
        classId: parseInt(bulkClassId),
        subjectId: parseInt(bulkSubjectId),
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
    const currentDate = new Date(bulkDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // Validate and filter grade records
    const validGrades = bulkGrades.filter(record => 
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
        console.log(`💾 Processing grade record for student ${record.studentId}:`, record);
        console.log(`💾 Grade comments: "${record.comments}"`);
        try {
          // First, try to find existing record
          const existing = await prisma.grade.findFirst({
            where: {
              studentId: record.studentId,
              classId: parseInt(bulkClassId),
              subjectId: parseInt(bulkSubjectId),
              date: new Date(bulkDate),
              timetableId: parseInt(timetableId)
            }
          });

          if (existing) {
            // Update existing record
            return prisma.grade.update({
              where: { id: existing.id },
              data: {
                value: record.points,
                description: record.comments || null,
                timetableId: parseInt(timetableId),
                updatedAt: new Date()
              }
            });
          } else {
            // Create new record
            return prisma.grade.create({
              data: {
                studentId: record.studentId,
                classId: parseInt(bulkClassId),
                subjectId: parseInt(bulkSubjectId),
                date: new Date(bulkDate),
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
        date: bulkDate
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

export async function DELETE(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    if (!teacherId) {
      console.log('❌ Unauthorized: No teacher ID provided');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('🗑️ Processing grade deletion request for teacher:', teacherId);
    
    const body = await request.json();
    console.log('📋 Delete request body:', JSON.stringify(body, null, 2));
    
    const { studentId, classId, subjectId, date } = body;

    if (!studentId || !classId || !subjectId || !date) {
      console.log('❌ Missing required fields: studentId, classId, subjectId, and date are required');
      return NextResponse.json({ 
        error: "Missing required fields: studentId, classId, subjectId, and date are required" 
      }, { status: 400 });
    }

    // Find and delete the grade record
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    
    console.log('🗑️ Deleting grade for:', {
      studentId: studentId.toString(),
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      dateRange: { startOfDay, endOfDay },
      teacherId: teacherId
    });

    const deletedGrade = await prisma.grade.deleteMany({
      where: {
        studentId: studentId.toString(),
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        date: {
          gte: startOfDay,
          lt: endOfDay
        },
        teacherId: teacherId
      }
    });

    console.log('✅ Grade record deleted successfully:', deletedGrade.count);
    return NextResponse.json({
      success: true,
      message: "Grade record deleted successfully",
      deletedCount: deletedGrade.count
    });

  } catch (error) {
    console.error('❌ Error deleting grade:', error);
    return NextResponse.json({ 
      error: "Failed to delete grade record" 
    }, { status: 500 });
  }
}