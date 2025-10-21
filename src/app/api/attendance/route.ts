import { NextRequest, NextResponse } from 'next/server';
import { withCSRF } from '@/lib/security';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';
import { validateOwnership } from '@/middlewares/validateOwnership';
import { auditLogger } from '@/middlewares/auditLogger';
import { rateLimit, RatePresets } from '@/middlewares/rateLimit';

const prisma = new PrismaClient();

async function deleteHandler(request: NextRequest, _ctx?: any, locals?: { user?: { id: string } }) {
  try {
    const teacherId = locals?.user?.id || request.headers.get('x-user-id');
    if (!teacherId) {
      console.log('❌ Unauthorized: No teacher ID provided');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const { studentId, classId, subjectId, date } = body;

    if (!studentId || !classId || !subjectId || !date) {
      console.log('❌ Missing required fields: studentId, classId, subjectId, and date are required');
      return NextResponse.json({ 
        error: "Missing required fields: studentId, classId, subjectId, and date are required" 
      }, { status: 400 });
    }

    // Find and delete the attendance record
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    
    console.log('🗑️ Deleting attendance for:', {
      studentId: studentId.toString(),
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      dateRange: { startOfDay, endOfDay },
      teacherId: teacherId
    });

    const deletedAttendance = await prisma.attendance.deleteMany({
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

    console.log('✅ Attendance record deleted successfully:', deletedAttendance.count);
    return NextResponse.json({
      success: true,
      message: "Attendance record deleted successfully",
      deletedCount: deletedAttendance.count
    });

  } catch (error) {
    console.error('❌ Error deleting attendance:', error);
    return NextResponse.json({ 
      error: "Failed to delete attendance record" 
    }, { status: 500 });
  }
}

export const DELETE = authenticateJWT(
  authorizeRole('TEACHER')(
    validateOwnership({
      getContext: async (req) => {
        const body = await req.clone().json().catch(() => ({}));
        return {
          studentId: body?.studentId,
          classId: body?.classId ? parseInt(body.classId) : undefined,
          subjectId: body?.subjectId ? parseInt(body.subjectId) : undefined,
        };
      },
      requireTeacherMatch: true,
      requireStudentSelf: false,
    })(rateLimit(RatePresets.API)(auditLogger({ action: 'DELETE_ATTENDANCE' })(withCSRF(deleteHandler))))
  )
);

async function putHandler(request: NextRequest, _ctx?: any, locals?: { user?: { id: string } }) {
  try {
    const teacherId = locals?.user?.id || request.headers.get('x-user-id');
    if (!teacherId) {
      console.log('❌ Unauthorized: No teacher ID provided');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const { id, status, notes } = body;

    if (!id || !status) {
      console.log('❌ Missing required fields: id and status are required');
      return NextResponse.json({ 
        error: "Missing required fields: id and status are required" 
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      console.log('❌ Invalid status:', status);
      return NextResponse.json({ 
        error: "Invalid status. Must be one of: PRESENT, ABSENT, LATE, EXCUSED" 
      }, { status: 400 });
    }

    // Update the attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: {
        status: status.toUpperCase(),
        notes: notes || null,
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

    console.log('✅ Attendance updated successfully:', updatedAttendance.id);

    return NextResponse.json({ 
      success: true, 
      message: "Attendance updated successfully",
      data: updatedAttendance
    });

  } catch (error) {
    console.error('❌ Error updating attendance:', error);
    return NextResponse.json({ 
      error: "Failed to update attendance",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const PUT = authenticateJWT(
  authorizeRole('TEACHER')(
    rateLimit(RatePresets.API)(auditLogger({ action: 'UPDATE_ATTENDANCE' })(withCSRF(putHandler)))
  )
);

async function postHandler(request: NextRequest, _ctx?: any, locals?: { user?: { id: string } }) {
  try {
    const teacherId = locals?.user?.id || request.headers.get('x-user-id');
    if (!teacherId) {
      console.log('❌ Unauthorized: No teacher ID provided');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.clone().json();
    
    const { studentId, classId, subjectId, date, status, notes, attendance, lessonNumber, electiveSubjectId, electiveGroupId } = body;

    // Check if this is a single attendance record or bulk attendance
    if (studentId && classId && subjectId && date && status) {
      // Single attendance record
      console.log('📝 Processing single attendance record');
      
      // Validate status
      const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        console.log('❌ Invalid status:', status);
        return NextResponse.json({ 
          error: "Invalid status. Must be one of: PRESENT, ABSENT, LATE, EXCUSED" 
        }, { status: 400 });
      }

      // Check if attendance record already exists for this lesson
      const targetLessonNumber = lessonNumber ? parseInt(lessonNumber) : 1;
      
      // Validate lesson number - only allow 1 or 2
      if (targetLessonNumber < 1 || targetLessonNumber > 2) {
        console.log('❌ Invalid lesson number:', targetLessonNumber);
        return NextResponse.json({ 
          error: "Invalid lesson number. Must be 1 or 2" 
        }, { status: 400 });
      }
      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: studentId.toString(),
          classId: parseInt(classId),
          subjectId: parseInt(subjectId),
          date: new Date(date),
          lessonNumber: targetLessonNumber
        }
      });

      let attendanceRecord;
      if (existing) {
        console.log(`📝 Updating existing attendance record (ID: ${existing.id})`);
        attendanceRecord = await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status: status.toUpperCase(),
            notes: notes || null,
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
        console.log(`➕ Creating new attendance record for student ${studentId}`);
        
        // Attendance is completely independent of timetables
        
        // Resolve class meta for branch/year
        const cls = await prisma.class.findUnique({
          where: { id: parseInt(classId) },
          select: { id: true, branchId: true, academicYearId: true }
        });

        // Create attendance record (no timetable connection)
        attendanceRecord = await prisma.attendance.create({
          data: {
            studentId: studentId.toString(),
            classId: parseInt(classId),
            subjectId: parseInt(subjectId),
            date: new Date(date),
            status: status.toUpperCase(),
            notes: notes || null,
            teacherId: teacherId,
            lessonNumber: targetLessonNumber,
            academicYearId: cls?.academicYearId || 0,
            branchId: cls?.branchId || 0,
            // Add elective fields if provided
            ...(electiveSubjectId && { electiveSubjectId: parseInt(electiveSubjectId) }),
            ...(electiveGroupId && { electiveGroupId: parseInt(electiveGroupId) })
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

      console.log('✅ Attendance saved successfully:', attendanceRecord.id);
      return NextResponse.json({ 
        success: true, 
        message: "Attendance saved successfully",
        data: attendanceRecord
      });
    }

    // Bulk attendance (disconnect from timetable)
    const bulkLessonNumber = lessonNumber ? parseInt(lessonNumber) : 1;
    
    // Validate lesson number - only allow 1 or 2
    if (bulkLessonNumber < 1 || bulkLessonNumber > 2) {
      console.log('❌ Invalid bulk lesson number:', bulkLessonNumber);
      return NextResponse.json({ 
        error: "Invalid lesson number. Must be 1 or 2" 
      }, { status: 400 });
    }
    if (!classId) {
      console.log('❌ Missing classId');
      return NextResponse.json({ error: "Missing required field: classId" }, { status: 400 });
    }
    if (!subjectId) {
      console.log('❌ Missing subjectId');
      return NextResponse.json({ error: "Missing required field: subjectId" }, { status: 400 });
    }
    if (!date) {
      console.log('❌ Missing date');
      return NextResponse.json({ error: "Missing required field: date" }, { status: 400 });
    }
    if (!attendance || !Array.isArray(attendance)) {
      console.log('❌ Missing or invalid attendance array');
      return NextResponse.json({ error: "Missing or invalid attendance array" }, { status: 400 });
    }

    // Validate and filter attendance records
    console.log('🔍 Validating attendance records...');
    console.log('Raw attendance data:', attendance);
    
    const validAttendance = attendance.filter(record => {
      if (!record) {
        console.log('❌ Invalid record: null or undefined');
        return false;
      }

      // Validate studentId and status
      const isValid = typeof record.studentId === 'string' &&
        record.studentId.length > 0 &&
        typeof record.status === 'string' &&
        record.status.trim() !== '' &&
        ['present', 'absent', 'late', 'excused', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(record.status.trim().toUpperCase()) &&
        (record.notes === undefined || typeof record.notes === 'string');

      if (!isValid) {
        console.log('❌ Invalid record:', record);
      } else {
        // Normalize the record for consistent processing
        record.status = record.status.trim().toUpperCase();
      }
      return isValid;
    });

    console.log(`✅ Valid records: ${validAttendance.length}/${attendance.length}`);

    if (validAttendance.length === 0) {
      console.log('❌ No valid attendance records provided');
      return NextResponse.json({ 
        error: "No valid attendance records provided",
        details: "All attendance records failed validation. Please ensure you have marked attendance for at least one student."
      }, { status: 400 });
    }

    console.log('💾 Saving attendance for:', {
      classId,
      subjectId,
      date,
      recordCount: validAttendance.length
    });

    // Save attendance records with error handling
    const attendanceRecords = [];
    const errors = [];
    
    for (let i = 0; i < validAttendance.length; i++) {
      const record = validAttendance[i];
      console.log(`💾 Processing record ${i + 1}/${validAttendance.length}:`, record);
      console.log(`💾 Record notes: "${record.notes}"`);
      
      try {
        // First, try to find existing record for this lesson
        console.log(`🔍 Looking for existing attendance for student ${record.studentId} on date ${date} lesson ${bulkLessonNumber}...`);
        const existing = await prisma.attendance.findFirst({
          where: {
            studentId: record.studentId.toString(),
            classId: parseInt(classId),
            subjectId: parseInt(subjectId),
            date: new Date(date),
            lessonNumber: bulkLessonNumber
          }
        });
        
        console.log(`🔍 Existing record found:`, existing ? `ID: ${existing.id}, Status: ${existing.status}, Notes: ${existing.notes}` : 'None');

        let attendanceRecord;
        if (existing) {
          console.log(`📝 Updating existing attendance record (ID: ${existing.id})`);
          // Update existing record
          attendanceRecord = await prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              notes: record.notes || null,
              teacherId: teacherId,
              updatedAt: new Date()
            }
          });
          console.log(`✅ Updated attendance for student ${record.studentId}`);
        } else {
          console.log(`➕ Creating new attendance record for student ${record.studentId}`);
          // Create new record
          attendanceRecord = await prisma.attendance.create({
            data: {
              studentId: record.studentId.toString(),
              classId: parseInt(classId),
              subjectId: parseInt(subjectId),
              date: new Date(date),
              status: record.status,
              notes: record.notes || null,
              teacherId: teacherId,
              lessonNumber: bulkLessonNumber,
              academicYearId: 1,
              branchId: 1,
              // Add elective fields if provided
              ...(electiveSubjectId && { electiveSubjectId: parseInt(electiveSubjectId) }),
              ...(electiveGroupId && { electiveGroupId: parseInt(electiveGroupId) })
            }
          });
          console.log(`✅ Created attendance for student ${record.studentId}`);
        }
        
        attendanceRecords.push(attendanceRecord);
      } catch (recordError) {
        const errorMsg = `Failed to save attendance for student ${record.studentId}: ${recordError instanceof Error ? recordError.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        // Continue with other records even if one fails
      }
    }

    console.log(`📊 Final results: ${attendanceRecords.length} saved, ${errors.length} errors`);

    if (attendanceRecords.length === 0) {
      console.log('❌ No attendance records were saved');
      return NextResponse.json({ 
        error: "Failed to save any attendance records",
        details: errors.length > 0 ? errors : "Unknown error occurred"
      }, { status: 500 });
    }

    const successMessage = errors.length === 0 
      ? `✅ Successfully saved all ${attendanceRecords.length} attendance records`
      : `⚠️ Saved ${attendanceRecords.length} attendance records with ${errors.length} errors`;

    console.log(successMessage);

    return NextResponse.json({ 
      success: true, 
      message: successMessage,
      savedRecords: attendanceRecords.length,
      totalRecords: validAttendance.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('💥 Critical error in attendance API:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError'
    });
    
    return NextResponse.json({ 
      error: "Failed to save attendance", 
      details: error instanceof Error ? error.message : 'Unknown error',
      type: 'CRITICAL_ERROR'
    }, { status: 500 });
  }
}

export const POST = authenticateJWT(
  authorizeRole('TEACHER')(
    validateOwnership({
      getContext: async (req) => {
        const body = await req.clone().json().catch(() => ({}));
        return {
          studentId: body?.studentId,
          classId: body?.classId ? parseInt(body.classId) : undefined,
          subjectId: body?.subjectId ? parseInt(body.subjectId) : undefined,
        };
      },
      requireTeacherMatch: true,
      requireStudentSelf: false,
    })(rateLimit(RatePresets.API)(auditLogger({ action: 'CREATE_OR_UPDATE_ATTENDANCE' })(withCSRF(postHandler))))
  )
);