import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/attendance/students?classId=1&subjectId=1 - Get students for attendance taking
export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');

    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const academicYearId = searchParams.get('academicYearId');
    const branchId = searchParams.get('branchId');

    console.log('🔍 Fetching students with params:', { teacherId, classId, subjectId, academicYearId, branchId });

    if (!classId) {
      console.log('❌ No classId provided');
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Skip teacher assignment verification for now to debug
    console.log('⏭️ Skipping teacher verification, fetching students directly');

    // First check if the class exists
    const classExists = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
      select: { id: true, name: true }
    });

    if (!classExists) {
      console.error('❌ Class not found:', classId);
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    console.log('✅ Class found:', classExists);

    // Get all students in the class (remove status filter temporarily)
    const students = await prisma.student.findMany({
      where: {
        classId: parseInt(classId)
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        status: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    console.log(`📊 Students found: ${students.length} for class: ${classId}`);
    if (students.length > 0) {
      console.log('👥 Sample student:', students[0]);
    } else {
      console.log('⚠️ No students found in class');
    }

    const response = {
      success: true,
      data: students,
      students: students, // Also include as 'students' key for compatibility
      count: students.length
    };
    
    console.log('📤 Sending response:', { success: response.success, count: response.count });
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
