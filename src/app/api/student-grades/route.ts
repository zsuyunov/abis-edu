import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// GET /api/student-grades - Get student's grades and statistics
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const studentId = headersList.get('x-user-id');

    if (!studentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'grades';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const subjectId = searchParams.get('subjectId');

    // Build where clause
    const whereClause: any = {
      studentId
    };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (subjectId) {
      whereClause.subjectId = parseInt(subjectId);
    }

    if (view === 'statistics') {
      // Fetch grade statistics
      const grades = await prisma.grade.findMany({
        where: whereClause,
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { date: 'desc' }
        ]
      });

      // Calculate statistics
      const totalGrades = grades.length;
      const averageGrade = totalGrades > 0
        ? grades.reduce((sum, grade) => sum + (grade.value / grade.maxValue) * 100, 0) / totalGrades
        : 0;

      const highestGrade = totalGrades > 0
        ? Math.max(...grades.map(grade => (grade.value / grade.maxValue) * 100))
        : 0;

      const lowestGrade = totalGrades > 0
        ? Math.min(...grades.map(grade => (grade.value / grade.maxValue) * 100))
        : 0;

      // Calculate weekly average (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyGrades = grades.filter(grade => new Date(grade.date) >= weekAgo);
      const weeklyAverage = weeklyGrades.length > 0
        ? weeklyGrades.reduce((sum, grade) => sum + (grade.value / grade.maxValue) * 100, 0) / weeklyGrades.length
        : 0;

      // Subject averages
      const subjectMap = new Map();
      grades.forEach(grade => {
        const subjectName = grade.subject.name;
        const percentage = (grade.value / grade.maxValue) * 100;

        if (!subjectMap.has(subjectName)) {
          subjectMap.set(subjectName, { total: 0, count: 0 });
        }

        const subjectData = subjectMap.get(subjectName);
        subjectData.total += percentage;
        subjectData.count += 1;
      });

      const subjectAverages = Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        average: data.total / data.count,
        gradeCount: data.count
      }));

      // Recent grades
      const recentGrades = grades.slice(0, 10).map(grade => ({
        id: grade.id.toString(),
        value: grade.value,
        maxValue: grade.maxValue,
        subject: grade.subject.name,
        date: grade.date.toISOString(),
        type: grade.type
      }));

      const statistics = {
        weeklyAverage,
        totalGrades,
        averageGrade,
        highestGrade,
        lowestGrade,
        subjectAverages,
        recentGrades
      };

      return NextResponse.json({
        success: true,
        statistics
      });

    } else {
      // Fetch regular grade records
      const grades = await prisma.grade.findMany({
        where: whereClause,
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          class: {
            select: {
              id: true,
              name: true
            }
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { subject: { name: 'asc' } }
        ]
      });

      // Transform data for frontend
      const transformedGrades = grades.map(grade => ({
        id: grade.id.toString(),
        value: grade.value,
        maxValue: grade.maxValue,
        percentage: (grade.value / grade.maxValue) * 100,
        subject: grade.subject.name,
        class: grade.class.name,
        teacher: `${grade.teacher.firstName} ${grade.teacher.lastName}`,
        date: grade.date.toISOString(),
        type: grade.type,
        description: grade.description
      }));

      return NextResponse.json({
        success: true,
        grades: transformedGrades,
        totalCount: grades.length
      });
    }

  } catch (error) {
    console.error('Error fetching student grades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}