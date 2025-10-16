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
    
    const { studentId, classId, subjectId, date, value, description, grades, lessonNumber } = body;

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

      // Validate lesson number - only allow 1 or 2
      const targetLessonNumber = lessonNumber ? parseInt(lessonNumber) : 1;
      if (targetLessonNumber < 1 || targetLessonNumber > 2) {
        console.log('❌ Invalid lesson number:', targetLessonNumber);
        return NextResponse.json({ 
          error: "Invalid lesson number. Must be 1 or 2" 
        }, { status: 400 });
      }

      // Check if grade record already exists for this lesson
      const existing = await prisma.grade.findFirst({
        where: {
          studentId: studentId.toString(),
          classId: parseInt(classId),
          subjectId: parseInt(subjectId),
          date: new Date(date),
          lessonNumber: targetLessonNumber
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
        
        // Resolve class meta for branch/year and save grade without timetable dependency
        const cls = await prisma.class.findUnique({
          where: { id: parseInt(classId) },
          select: { id: true, branchId: true, academicYearId: true }
        });

        // Create grade record without timetable
        gradeRecord = await prisma.grade.create({
          data: {
            studentId: studentId.toString(),
            classId: parseInt(classId),
            subjectId: parseInt(subjectId),
            date: new Date(date),
            value: value,
            description: description || null,
            teacherId: teacherId,
            academicYearId: cls?.academicYearId || 0,
            branchId: cls?.branchId || 0,
            year: year,
            month: month,
            type: 'DAILY', // Default grade type
            lessonNumber: targetLessonNumber
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
    const { classId: bulkClassId, subjectId: bulkSubjectId, date: bulkDate, grades: bulkGrades, lessonNumber: bulkLessonNumber } = body;
    
    // Validate lesson number - only allow 1 or 2
    const validatedBulkLessonNumber = bulkLessonNumber ? parseInt(bulkLessonNumber) : 1;
    if (validatedBulkLessonNumber < 1 || validatedBulkLessonNumber > 2) {
      console.log('❌ Invalid bulk lesson number:', validatedBulkLessonNumber);
      return NextResponse.json({ 
        error: "Invalid lesson number. Must be 1 or 2" 
      }, { status: 400 });
    }

    // Validate required fields for bulk (disconnect from timetable)
    if (!bulkClassId || !bulkSubjectId || !bulkDate || !bulkGrades || !Array.isArray(bulkGrades)) {
      console.log("Validation failed:", { bulkClassId, bulkSubjectId, bulkDate, grades: Array.isArray(bulkGrades) });
      return NextResponse.json({ 
        error: "Missing required fields", 
        details: { bulkClassId, bulkSubjectId, bulkDate, grades: Array.isArray(bulkGrades) }
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

    // Resolve branch/year via class
    const cls = await prisma.class.findUnique({
      where: { id: parseInt(bulkClassId) },
      select: { academicYearId: true, branchId: true }
    });

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
              lessonNumber: validatedBulkLessonNumber
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
                classId: parseInt(bulkClassId),
                subjectId: parseInt(bulkSubjectId),
                date: new Date(bulkDate),
                value: record.points,
                description: record.comments || null,
                teacherId: teacherId,
                academicYearId: cls?.academicYearId || 0,
                branchId: cls?.branchId || 0,
                year: year,
                month: month,
                type: 'DAILY', // Default grade type
                lessonNumber: validatedBulkLessonNumber
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
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const month = searchParams.get('month');
    const academicYearId = searchParams.get('academicYearId');
    const branchId = searchParams.get('branchId');

    // Build where clause based on available parameters
    let whereClause: any = {
      teacherId: teacherId
    };

    if (classId && subjectId && month) {
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
        error: "classId+subjectId+month are required" 
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
        lessonNumber: grade.lessonNumber || 1
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
    
    const { studentId, classId, subjectId, date, lessonNumber } = body;

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
    
    console.log('🗑️ Deleting grade(s) for:', {
      studentId: studentId.toString(),
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      dateRange: { startOfDay, endOfDay },
      teacherId: teacherId,
      note: 'Deleting ALL lessons (lesson 1 and lesson 2) if they exist'
    });

    // Delete ALL grades for this student/date/class/subject combination
    // This includes both lesson 1 and lesson 2 if they exist
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
        // NOT filtering by lessonNumber - delete all lessons
      }
    });

    console.log('✅ Grade record(s) deleted successfully:', deletedGrade.count, 'grade(s) removed');
    return NextResponse.json({
      success: true,
      message: deletedGrade.count > 1 
        ? `All ${deletedGrade.count} lesson grades deleted successfully`
        : "Grade record deleted successfully",
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