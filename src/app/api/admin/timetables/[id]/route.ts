import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch single timetable
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timetable = await prisma.timetable.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        subject: true,
        class: true,
        branch: true,
        academicYear: true,
      }
    });

    if (!timetable) {
      return NextResponse.json({ 
        error: 'Timetable not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ data: timetable });

  } catch (error) {
    console.error('Error fetching timetable:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT - Update single timetable
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updateData = { ...body };

    // Convert time strings to Date objects if provided
    // Fix timezone issue: Create local time instead of UTC
    const createLocalTime = (timeString: string) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      // Use a fixed date in local timezone to avoid UTC conversion
      const date = new Date(1970, 0, 1, hours, minutes, 0, 0);
      return date;
    };

    if (updateData.startTime) {
      updateData.startTime = createLocalTime(updateData.startTime);
    }
    if (updateData.endTime) {
      updateData.endTime = createLocalTime(updateData.endTime);
    }

    // Convert day of week to uppercase if provided
    if (updateData.dayOfWeek) {
      updateData.dayOfWeek = updateData.dayOfWeek.toUpperCase();
    }

    const updatedTimetable = await prisma.timetable.update({
      where: { id: parseInt(params.id) },
      data: updateData,
      include: {
        subject: true,
        class: true,
        branch: true,
        academicYear: true,
      }
    });

    return NextResponse.json({ 
      message: 'Timetable updated successfully', 
      data: updatedTimetable
    });

  } catch (error) {
    console.error('Error updating timetable:', error);
    return NextResponse.json({ 
      error: 'Failed to update timetable' 
    }, { status: 500 });
  }
}

// DELETE - Delete single timetable
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.timetable.delete({
      where: { id: parseInt(params.id) }
    });

    return NextResponse.json({ 
      message: 'Timetable deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting timetable:', error);
    return NextResponse.json({ 
      error: 'Failed to delete timetable' 
    }, { status: 500 });
  }
}