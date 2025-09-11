import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// PATCH /api/attendance/[id] - Update attendance record
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers();
    const teacherId = headersList.get('x-user-id');

    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attendanceId = parseInt(params.id);
    if (isNaN(attendanceId)) {
      return NextResponse.json({ error: 'Invalid attendance ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, notes } = body;

    // Verify the attendance record exists and belongs to this teacher
    const existingRecord = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        teacherId
      }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Attendance record not found or unauthorized' }, { status: 404 });
    }

    // Update the attendance record
    const updatedRecord = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: status || existingRecord.status,
        notes: notes !== undefined ? notes : existingRecord.notes,
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
      message: 'Attendance updated successfully',
      data: updatedRecord
    });

  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/attendance/[id] - Delete attendance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers();
    const teacherId = headersList.get('x-user-id');

    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attendanceId = parseInt(params.id);
    if (isNaN(attendanceId)) {
      return NextResponse.json({ error: 'Invalid attendance ID' }, { status: 400 });
    }

    // Verify the attendance record exists and belongs to this teacher
    const existingRecord = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        teacherId
      }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Attendance record not found or unauthorized' }, { status: 404 });
    }

    // Delete the attendance record
    await prisma.attendance.delete({
      where: { id: attendanceId }
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
