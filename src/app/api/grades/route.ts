import { NextRequest, NextResponse } from 'next/server';
import { withCSRF } from '@/lib/security';
import prisma from '@/lib/prisma';

async function postHandler(request: NextRequest) {
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
        
        // Get current year and month for grade record
        const currentDate = new Date(date);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        // Find or create a lightweight timetable so grades are not blocked
        let timetable = await prisma.timetable.findFirst({
          where: {
            isActive: true,
            classId: parseInt(classId),
            subjectId: parseInt(subjectId)
          },
          select: { id: true, branchId: true, academicYearId: true }
        });

        // Load class meta for branch/year
        const cls = await prisma.class.findUnique({
          where: { id: parseInt(classId) },
          select: { id: true, branchId: true, academicYearId: true }
        });

        if (!timetable) {
          timetable = await prisma.timetable.create({
            data: {
              branchId: cls?.branchId || 0,
              classId: parseInt(classId),
              academicYearId: cls?.academicYearId || 0,
              subjectId: parseInt(subjectId),
              dayOfWeek: null,
              startTime: new Date('1970-01-01T08:00:00Z'),
              endTime: new Date('1970-01-01T09:00:00Z'),
              isActive: true,
              roomNumber: null,
              buildingName: 'virtual'
            },
            select: { id: true, branchId: true, academicYearId: true }
          });
          console.log('🆕 Created virtual timetable for grade:', timetable.id);
        }

        console.log('✅ Using timetable ID for grade:', timetable.id);

        // Create grade record with timetable ID (real or virtual)
        gradeRecord = await prisma.grade.create({
          data: {
            studentId: studentId.toString(),
            classId: parseInt(classId),
            subjectId: parseInt(subjectId),
            date: new Date(date),
            value: value,
            description: description || null,
            teacherId: teacherId,
            timetableId: timetable.id,
            academicYearId: cls?.academicYearId || 0,
            branchId: cls?.branchId || 0,
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

    // Bulk grades (timetable optional)
    const { timetableId, classId: bulkClassId, subjectId: bulkSubjectId, date: bulkDate, grades: bulkGrades } = body;

    // Validate required fields for bulk (without strict timetable)
    if (!bulkClassId || !bulkSubjectId || !bulkDate || !bulkGrades || !Array.isArray(bulkGrades)) {
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

    // Resolve branch/year via class and create/reuse a timetable if needed
    const cls = await prisma.class.findUnique({
      where: { id: parseInt(bulkClassId) },
      select: { id: true, branchId: true, academicYearId: true }
    });
    let resolvedTimetableId: number;
    if (timetableId) {
      resolvedTimetableId = parseInt(timetableId);
    } else {
      const existingTT = await prisma.timetable.findFirst({
        where: { isActive: true, classId: parseInt(bulkClassId), subjectId: parseInt(bulkSubjectId) },
        select: { id: true }
      });
      if (existingTT) {
        resolvedTimetableId = existingTT.id;
      } else {
        const created = await prisma.timetable.create({
          data: {
            branchId: cls?.branchId || 0,
            classId: parseInt(bulkClassId),
            academicYearId: cls?.academicYearId || 0,
            subjectId: parseInt(bulkSubjectId),
            dayOfWeek: null,
            startTime: new Date('1970-01-01T08:00:00Z'),
            endTime: new Date('1970-01-01T09:00:00Z'),
            isActive: true,
            roomNumber: null,
            buildingName: 'virtual'
          },
          select: { id: true }
        });
        resolvedTimetableId = created.id;
        console.log('🆕 Created virtual timetable for bulk grades:', resolvedTimetableId);
      }
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
                timetableId: resolvedTimetableId,
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
                timetableId: resolvedTimetableId,
                academicYearId: cls?.academicYearId || 0,
                branchId: cls?.branchId || 0,
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

export const POST = withCSRF(postHandler);

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
async function putHandler(request: NextRequest) {
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

export const PUT = withCSRF(putHandler);

async function deleteHandler(request: NextRequest) {
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

export const DELETE = withCSRF(deleteHandler);