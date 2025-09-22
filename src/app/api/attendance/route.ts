import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    if (!teacherId) {
      console.log('❌ Unauthorized: No teacher ID provided');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('📝 Processing attendance update request for teacher:', teacherId);
    
    const body = await request.json();
    console.log('📋 Update request body:', JSON.stringify(body, null, 2));
    
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

export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    if (!teacherId) {
      console.log('❌ Unauthorized: No teacher ID provided');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('📝 Processing attendance request for teacher:', teacherId);
    
    const body = await request.json();
    console.log('📋 Request body:', JSON.stringify(body, null, 2));
    
    const { timetableId, classId, subjectId, date, attendance } = body;

    // Validate required fields with detailed logging
    if (!timetableId) {
      console.log('❌ Missing timetableId');
      return NextResponse.json({ error: "Missing required field: timetableId" }, { status: 400 });
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
      timetableId,
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
        // First, try to find existing record
        console.log(`🔍 Looking for existing attendance for student ${record.studentId} with timetableId ${timetableId} on date ${date}...`);
        const existing = await prisma.attendance.findFirst({
          where: {
            studentId: record.studentId.toString(),
            timetableId: parseInt(timetableId),
            date: new Date(date)
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
              timetableId: parseInt(timetableId),
              academicYearId: 1, // Default academic year
              branchId: 1 // Default branch
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