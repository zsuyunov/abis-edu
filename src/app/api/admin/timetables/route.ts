import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// File-based persistence for timetables
const TIMETABLES_FILE = join(process.cwd(), 'temp-timetables.json');

// Load timetables from file
function loadTimetables(): any[] {
  try {
    if (existsSync(TIMETABLES_FILE)) {
      const data = readFileSync(TIMETABLES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading timetables:', error);
  }
  return [];
}

// Save timetables to file
function saveTimetables(timetables: any[]): void {
  try {
    writeFileSync(TIMETABLES_FILE, JSON.stringify(timetables, null, 2));
  } catch (error) {
    console.error('Error saving timetables:', error);
  }
}

// Initialize with saved data
let savedTimetables: any[] = loadTimetables();

// GET - Fetch timetables with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const classId = searchParams.get('classId');
    const academicYearId = searchParams.get('academicYearId');
    const isActive = searchParams.get('isActive');

    console.log('GET /api/admin/timetables called with params:', { branchId, classId, academicYearId, isActive });
    console.log('Current savedTimetables:', savedTimetables);

    // Filter timetables based on query parameters
    let filteredTimetables = savedTimetables;
    
    if (branchId) {
      filteredTimetables = filteredTimetables.filter(t => t.branchId === parseInt(branchId));
    }
    if (classId) {
      filteredTimetables = filteredTimetables.filter(t => t.classId === parseInt(classId));
    }
    if (academicYearId) {
      filteredTimetables = filteredTimetables.filter(t => t.academicYearId === parseInt(academicYearId));
    }
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      filteredTimetables = filteredTimetables.filter(t => t.isActive === activeFilter);
    }

    console.log('Filtered timetables:', filteredTimetables);
    return NextResponse.json(filteredTimetables);
  } catch (error) {
    console.error('Error fetching timetables:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new timetable
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received timetable data:', body);
    
    // Check if this is a single timetable entry or batch of timetable slots
    if (body.dayOfWeek && body.subjectId) {
      // Single timetable entry format
      const timetableEntry = {
        id: Math.floor(Math.random() * 10000),
        branchId: parseInt(body.branchId),
        classId: parseInt(body.classId),
        academicYearId: parseInt(body.academicYearId),
        dayOfWeek: body.dayOfWeek,
        subjectId: body.subjectId,
        subjectIds: body.subjectIds || [body.subjectId],
        teacherIds: body.teacherIds || [],
        startTime: body.startTime,
        endTime: body.endTime,
        roomNumber: body.roomNumber || '',
        buildingName: body.buildingName || '',
        isElective: body.isElective || false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Mock related data
        branch: { id: body.branchId, shortName: 'SuzukOta', legalName: 'SuzukOta - Kindergarten' },
        class: { id: body.classId, name: '9-A' },
        academicYear: { id: body.academicYearId, name: '2024-2025', isCurrent: true },
        subject: body.subjectId ? { id: body.subjectId, name: 'Subject ' + body.subjectId } : null
      };
      
      // Add to saved timetables
      savedTimetables.push(timetableEntry);
      
      // Save to file for persistence
      saveTimetables(savedTimetables);
      
      return NextResponse.json({ 
        message: 'Timetable entry saved successfully', 
        data: timetableEntry
      }, { status: 201 });
    }

    // Batch timetable slots format (original logic)
    const { branchId, classId, academicYearId, timetableSlots } = body;
    
    if (!timetableSlots) {
      return NextResponse.json({ error: 'Invalid timetable data format' }, { status: 400 });
    }
    
    // Convert timetable slots to individual timetable entries
    const timetableEntries = [];
    
    for (const [dayOfWeek, slots] of Object.entries(timetableSlots)) {
      if (Array.isArray(slots)) {
        for (const slot of slots) {
          const timetableEntry = {
            id: Math.floor(Math.random() * 10000),
            branchId: parseInt(branchId),
            classId: parseInt(classId),
            academicYearId: parseInt(academicYearId),
            dayOfWeek,
            subjectId: slot.subjectId,
            subjectIds: slot.subjectIds || [],
            teacherIds: slot.teacherIds || [],
            startTime: slot.startTime,
            endTime: slot.endTime,
            roomNumber: slot.roomNumber || '',
            buildingName: slot.buildingName || '',
            isElective: slot.isElective || false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Mock related data
            branch: { id: branchId, shortName: 'SuzukOta', legalName: 'SuzukOta - Kindergarten' },
            class: { id: classId, name: '9-A' },
            academicYear: { id: academicYearId, name: '2024-2025', isCurrent: true },
            subject: slot.subjectId ? { id: slot.subjectId, name: 'Subject ' + slot.subjectId } : null
          };
          timetableEntries.push(timetableEntry);
        }
      }
    }
    
    // Add to saved timetables
    savedTimetables.push(...timetableEntries);
    
    // Save to file for persistence
    saveTimetables(savedTimetables);
    
    return NextResponse.json({ 
      message: 'Timetable slots saved successfully', 
      data: timetableEntries,
      count: timetableEntries.length
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating timetable:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
