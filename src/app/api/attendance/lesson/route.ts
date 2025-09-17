import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/attendance/lesson?timetableId=1&date=2024-01-15 - Get existing attendance for a specific lesson
export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');

    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timetableId = searchParams.get('timetableId');
    const date = searchParams.get('date');

    console.log('🔍 Fetching lesson attendance with params:', { teacherId, timetableId, date });

    if (!timetableId || !date) {
      console.log('❌ Missing required parameters');
      return NextResponse.json({ 
        error: 'Timetable ID and date are required' 
      }, { status: 400 });
    }

    // Parse the date to ensure it's in the correct format
    const parsedDate = new Date(date);
    console.log('🔍 Parsed date:', parsedDate, 'ISO:', parsedDate.toISOString());

    // Use a date range to handle timezone issues
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('🔍 Date range:', { startOfDay, endOfDay });

    // Fetch existing attendance records for this specific lesson
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        timetableId: parseInt(timetableId),
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
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
      },
      orderBy: {
        student: {
          firstName: 'asc'
        }
      }
    });

    console.log(`📊 Found ${attendanceRecords.length} existing attendance records for lesson ${timetableId} on ${date}`);

    return NextResponse.json({
      success: true,
      data: attendanceRecords
    });

  } catch (error) {
    console.error('Error fetching lesson attendance:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch lesson attendance' 
    }, { status: 500 });
  }
}
