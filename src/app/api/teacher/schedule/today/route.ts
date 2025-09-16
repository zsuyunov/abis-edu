import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    
    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 401 });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get all timetables for today and filter by teacher in JavaScript
    const allTodayTimetables = await prisma.timetable.findMany({
      where: {
        startTime: {
          gte: new Date(todayStr + 'T00:00:00.000Z'),
          lt: new Date(todayStr + 'T23:59:59.999Z')
        },
        isActive: true
      },
      include: {
        class: true,
        subject: true,
        branch: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Filter timetables where teacherId matches
    const todayTimetables = allTodayTimetables.filter(timetable => {
      return timetable.teacherIds &&
             Array.isArray(timetable.teacherIds) &&
             timetable.teacherIds.includes(teacherId);
    });

    // Transform the data
    const schedule = todayTimetables.map(timetable => ({
      id: timetable.id,
      startTime: timetable.startTime?.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }) || "00:00",
      endTime: timetable.endTime?.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }) || "00:00",
      subject: timetable.subject?.name || 'Unknown Subject',
      class: timetable.class?.name || 'Unknown Class',
      room: timetable.roomNumber || timetable.buildingName || 'TBA',
      status: timetable.isActive ? 'ACTIVE' : 'INACTIVE'
    }));

    return NextResponse.json({
      success: true,
      date: todayStr,
      schedule: schedule,
      totalLessons: schedule.length
    });

  } catch (error) {
    console.error('Error fetching today schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today schedule' },
      { status: 500 }
    );
  }
}
