import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    
    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 401 });
    }

    // Get pending homework assignments for this teacher
    const pendingHomework = await prisma.homework.findMany({
      where: {
        teacherId: teacherId,
        status: 'ACTIVE',
        dueDate: {
          gte: new Date() // Only future or today's due dates
        }
      },
      include: {
        class: true,
        subject: true,
        branch: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    // Transform homework data
    const homeworkWithStats = pendingHomework.map(homework => {
      return {
        id: homework.id,
        title: homework.title || 'Untitled Homework',
        description: homework.description || '',
        dueDate: homework.dueDate,
        totalPoints: homework.totalPoints || 0,
        class: homework.class?.name || 'Unknown Class',
        subject: homework.subject?.name || 'Unknown Subject',
        branch: homework.branch?.shortName || 'Unknown Branch',
        daysUntilDue: Math.ceil((new Date(homework.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      };
    });

    return NextResponse.json({
      success: true,
      pendingHomework: homeworkWithStats,
      totalPending: homeworkWithStats.length,
      summary: {
        dueToday: homeworkWithStats.filter(h => h.daysUntilDue === 0).length,
        dueTomorrow: homeworkWithStats.filter(h => h.daysUntilDue === 1).length,
        dueThisWeek: homeworkWithStats.filter(h => h.daysUntilDue <= 7).length
      }
    });

  } catch (error) {
    console.error('Error fetching pending homework:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending homework' },
      { status: 500 }
    );
  }
}
