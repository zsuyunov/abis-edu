import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/jwt-auth';
import prisma from '@/lib/prisma';
import { homeworkFilterSchema } from '@/lib/formValidationSchemas';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = authUser.userId;

    // Get parent with children information
    const parent = await prisma.parent.findUnique({
      where: { id: userId },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            branchId: true,
            classId: true,
            academicYearId: true,
            branch: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    });

    if (!parent || !parent.students.length) {
      return new NextResponse('Parent not found or no children assigned', { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('childId');
    const academicYearId = searchParams.get('academicYearId');
    const subjectId = searchParams.get('subjectId');
    const statusFilter = searchParams.get('status'); // e.g., 'ACTIVE', 'EXPIRED', 'ARCHIVED'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // If no childId provided, return children list for selection
    if (!childId) {
      return NextResponse.json({
        children: parent.students,
        selectedChild: null,
        homeworks: [],
        classStats: null,
      });
    }

    // Validate that the selected child belongs to this parent
    const selectedChild = parent.students.find(child => child.id === childId);
    if (!selectedChild) {
      return new NextResponse('Child not found or not assigned to this parent', { status: 403 });
    }

    const filters = homeworkFilterSchema.safeParse({
      branchId: selectedChild.branchId,
      academicYearId: academicYearId ? parseInt(academicYearId) : selectedChild.academicYearId,
      classId: selectedChild.classId,
      subjectId: subjectId ? parseInt(subjectId) : undefined,
      status: statusFilter || 'ALL',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    if (!filters.success) {
      return new NextResponse(`Invalid filter parameters: ${filters.error.message}`, { status: 400 });
    }

    const whereClause: any = {
      branchId: filters.data.branchId,
      academicYearId: filters.data.academicYearId,
      classId: filters.data.classId,
    };

    if (filters.data.subjectId) {
      whereClause.subjectId = filters.data.subjectId;
    }
    if (filters.data.status && filters.data.status !== 'ALL') {
      whereClause.status = filters.data.status;
    }
    if (filters.data.startDate && filters.data.endDate) {
      whereClause.dueDate = {
        gte: filters.data.startDate,
        lte: filters.data.endDate,
      };
    } else if (filters.data.startDate) {
      whereClause.dueDate = { gte: filters.data.startDate };
    } else if (filters.data.endDate) {
      whereClause.dueDate = { lte: filters.data.endDate };
    }

    // Fetch homework assignments for the child's class
    const homeworks = await prisma.homework.findMany({
      where: whereClause,
      include: {
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
        attachments: true,
        submissions: {
          where: { studentId: selectedChild.id },
          select: { 
            id: true, 
            status: true, 
            submissionDate: true, 
            grade: true, 
            feedback: true, 
            isLate: true, 
            content: true,
            attachments: true 
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });

    // Calculate class statistics for comparison
    const classSubmissions = await prisma.homeworkSubmission.findMany({
      where: {
        homework: {
          branchId: selectedChild.branchId,
          academicYearId: filters.data.academicYearId,
          classId: selectedChild.classId,
        },
      },
      include: {
        homework: { select: { id: true } },
        student: { select: { id: true } },
      },
    });

    // Get all students in the class
    const classStudents = await prisma.student.findMany({
      where: {
        branchId: selectedChild.branchId,
        academicYearId: filters.data.academicYearId,
        classId: selectedChild.classId,
      },
      select: { id: true },
    });

    const totalClassStudents = classStudents.length;
    const totalHomeworksForClass = homeworks.length;

    // Calculate class average completion rate
    let classSubmissionCount = 0;
    if (totalHomeworksForClass > 0 && totalClassStudents > 0) {
      const submissionsByHomework: { [key: number]: number } = {};
      classSubmissions.forEach(submission => {
        if (!submissionsByHomework[submission.homework.id]) {
          submissionsByHomework[submission.homework.id] = 0;
        }
        submissionsByHomework[submission.homework.id]++;
      });
      
      const totalPossibleSubmissions = totalHomeworksForClass * totalClassStudents;
      classSubmissionCount = Object.values(submissionsByHomework).reduce((sum, count) => sum + count, 0);
    }

    const classAverageCompletionRate = totalHomeworksForClass > 0 && totalClassStudents > 0 
      ? (classSubmissionCount / (totalHomeworksForClass * totalClassStudents)) * 100 
      : 0;

    // Calculate child's completion rate
    const childSubmittedCount = homeworks.filter(hw => 
      hw.submissions.length > 0 && 
      (hw.submissions[0].status === 'SUBMITTED' || hw.submissions[0].status === 'GRADED' || hw.submissions[0].status === 'LATE')
    ).length;
    
    const childCompletionRate = totalHomeworksForClass > 0 ? (childSubmittedCount / totalHomeworksForClass) * 100 : 0;

    const classStats = {
      totalHomeworks: totalHomeworksForClass,
      totalStudents: totalClassStudents,
      classAverageCompletionRate,
      childCompletionRate,
      childSubmittedCount,
    };

    return NextResponse.json({
      children: parent.students,
      selectedChild,
      homeworks,
      classStats,
    });

  } catch (error) {
    console.error('[PARENT_HOMEWORK_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
