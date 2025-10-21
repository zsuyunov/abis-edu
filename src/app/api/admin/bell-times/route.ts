import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

// Temporary in-memory storage until database migration is applied
let savedBellTimes: any[] = [];

// GET - Fetch bell times by year range
export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearRange = searchParams.get('yearRange');

    // If we have saved bell times, return them
    if (savedBellTimes.length > 0) {
      const filteredBellTimes = yearRange 
        ? savedBellTimes.filter(bt => bt.yearRange === yearRange)
        : savedBellTimes;
      return NextResponse.json(filteredBellTimes);
    }

    // Return default bell times data with lessons and break times
    const defaultBellTimes = [
      {
        id: 1,
        yearRange: yearRange || '7-13',
        eventName: 'Breakfast',
        startTime: '07:30',
        endTime: '07:55',
        notes: 'Morning meal time',
        isBreak: true
      },
      {
        id: 2,
        yearRange: yearRange || '7-13',
        eventName: 'Lesson 1',
        startTime: '08:00',
        endTime: '08:45',
        notes: null,
        isBreak: false
      },
      {
        id: 3,
        yearRange: yearRange || '7-13',
        eventName: 'Lesson 2',
        startTime: '08:50',
        endTime: '09:35',
        notes: null,
        isBreak: false
      },
      {
        id: 4,
        yearRange: yearRange || '7-13',
        eventName: 'Snack Time',
        startTime: '09:40',
        endTime: '09:55',
        notes: 'Morning snack break',
        isBreak: true
      },
      {
        id: 5,
        yearRange: yearRange || '7-13',
        eventName: 'Lesson 3',
        startTime: '10:00',
        endTime: '10:45',
        notes: null,
        isBreak: false
      },
      {
        id: 6,
        yearRange: yearRange || '7-13',
        eventName: 'Lesson 4',
        startTime: '10:50',
        endTime: '11:35',
        notes: null,
        isBreak: false
      },
      {
        id: 7,
        yearRange: yearRange || '7-13',
        eventName: 'Rest Time',
        startTime: '11:40',
        endTime: '12:00',
        notes: 'Mid-day rest period',
        isBreak: true
      },
      {
        id: 8,
        yearRange: yearRange || '7-13',
        eventName: 'Lunch',
        startTime: '12:05',
        endTime: '12:50',
        notes: 'Lunch break',
        isBreak: true
      },
      {
        id: 9,
        yearRange: yearRange || '7-13',
        eventName: 'Lesson 5',
        startTime: '12:55',
        endTime: '13:40',
        notes: null,
        isBreak: false
      },
      {
        id: 10,
        yearRange: yearRange || '7-13',
        eventName: 'Lesson 6',
        startTime: '13:45',
        endTime: '14:30',
        notes: null,
        isBreak: false
      }
    ];

    return NextResponse.json(defaultBellTimes);
  } catch (error) {
    console.error('Error fetching bell times:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}))

// POST - Create or update bell times
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received bell times data:', body);
    
    // Store the bell times data
    const { yearRange, bellTimes } = body;
    
    // Remove existing bell times for this year range
    savedBellTimes = savedBellTimes.filter(bt => bt.yearRange !== yearRange);
    
    // Add new bell times
    const newBellTimes = bellTimes.map((bt: any, index: number) => ({
      id: Math.floor(Math.random() * 10000),
      yearRange,
      eventName: bt.eventName,
      startTime: bt.startTime,
      endTime: bt.endTime,
      notes: bt.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    savedBellTimes.push(...newBellTimes);
    
    return NextResponse.json({ 
      message: 'Bell times saved successfully', 
      data: newBellTimes,
      count: newBellTimes.length
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating bell times:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = authenticateJWT(authorizeRole('ADMIN')(withCSRF(postHandler)));
