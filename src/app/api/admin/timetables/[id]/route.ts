import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// File-based storage functions
const timetablesFilePath = join(process.cwd(), 'temp-timetables.json');

const loadTimetables = (): any[] => {
  try {
    const data = readFileSync(timetablesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const saveTimetables = (timetables: any[]) => {
  try {
    writeFileSync(timetablesFilePath, JSON.stringify(timetables, null, 2));
  } catch (error) {
    console.error('Error saving timetables:', error);
  }
};

// GET - Fetch single timetable by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const timetables = loadTimetables();
    const timetable = timetables.find(t => t.id === parseInt(params.id));
    
    if (!timetable) {
      return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
    }
    
    return NextResponse.json(timetable);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update timetable
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const timetables = loadTimetables();
    const timetableIndex = timetables.findIndex(t => t.id === parseInt(params.id));
    
    if (timetableIndex === -1) {
      return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
    }
    
    // Update the timetable
    const updatedTimetable = {
      ...timetables[timetableIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    // Update subject name if subjectId changed
    if (body.subjectId && body.subjectId !== timetables[timetableIndex].subjectId) {
      updatedTimetable.subject = { id: body.subjectId, name: 'Subject ' + body.subjectId };
    }
    
    timetables[timetableIndex] = updatedTimetable;
    saveTimetables(timetables);
    
    return NextResponse.json({ 
      message: 'Timetable updated successfully', 
      data: updatedTimetable 
    });
  } catch (error) {
    console.error('Error updating timetable:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete timetable
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const timetables = loadTimetables();
    const timetableIndex = timetables.findIndex(t => t.id === parseInt(params.id));
    
    if (timetableIndex === -1) {
      return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
    }
    
    // Remove the timetable
    const deletedTimetable = timetables.splice(timetableIndex, 1)[0];
    saveTimetables(timetables);
    
    return NextResponse.json({ 
      message: 'Timetable deleted successfully', 
      data: deletedTimetable 
    });
  } catch (error) {
    console.error('Error deleting timetable:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
