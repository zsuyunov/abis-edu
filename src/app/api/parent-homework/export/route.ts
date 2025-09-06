import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/jwt-auth';
import prisma from '@/lib/prisma';
import { homeworkFilterSchema } from '@/lib/formValidationSchemas';
import { generatePdfReport } from '@/lib/pdfGenerator'; // Assuming this utility exists
import { generateExcelReport } from '@/lib/excelGenerator'; // Assuming this utility exists

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
    const statusFilter = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') as 'pdf' | 'excel';

    if (!childId) {
      return new NextResponse('Child ID is required', { status: 400 });
    }

    if (!format) {
      return new NextResponse('Format is required', { status: 400 });
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
        submissions: {
          where: { studentId: selectedChild.id },
          select: { 
            id: true, 
            status: true, 
            submissionDate: true, 
            grade: true, 
            feedback: true, 
            isLate: true 
          },
        },
      },
      orderBy: { dueDate: 'asc' },
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
      },
    });

    const classStudents = await prisma.student.findMany({
      where: {
        branchId: selectedChild.branchId,
        academicYearId: filters.data.academicYearId,
        classId: selectedChild.classId,
      },
      select: { id: true },
    });

    const totalClassStudents = classStudents.length;
    const totalHomeworks = homeworks.length;

    // Calculate statistics
    const submittedCount = homeworks.filter(hw => 
      hw.submissions.length > 0 && 
      (hw.submissions[0].status === 'SUBMITTED' || hw.submissions[0].status === 'GRADED' || hw.submissions[0].status === 'LATE')
    ).length;
    
    const lateCount = homeworks.filter(hw => 
      hw.submissions.length > 0 && hw.submissions[0].isLate
    ).length;
    
    const missedCount = homeworks.filter(hw => 
      hw.submissions.length === 0 && new Date() > hw.dueDate
    ).length;
    
    const pendingCount = homeworks.filter(hw => 
      hw.submissions.length === 0 && new Date() <= hw.dueDate
    ).length;

    const childCompletionRate = totalHomeworks > 0 ? (submittedCount / totalHomeworks) * 100 : 0;
    const onTimeRate = submittedCount > 0 ? ((submittedCount - lateCount) / submittedCount) * 100 : 0;

    // Calculate class average for comparison
    const classSubmissionCount = classSubmissions.length;
    const classAverageCompletionRate = totalHomeworks > 0 && totalClassStudents > 0 
      ? (classSubmissionCount / (totalHomeworks * totalClassStudents)) * 100 
      : 0;

    // Calculate average grade
    const gradedHomeworks = homeworks.filter(hw => hw.submissions.length > 0 && hw.submissions[0].grade !== null);
    const averageGrade = gradedHomeworks.length > 0 
      ? gradedHomeworks.reduce((sum, hw) => sum + (hw.submissions[0].grade || 0), 0) / gradedHomeworks.length 
      : null;

    const reportData = {
      parentName: `${parent.firstName} ${parent.lastName}`,
      childName: `${selectedChild.firstName} ${selectedChild.lastName}`,
      childId: selectedChild.id,
      branchName: selectedChild.branch.name,
      className: selectedChild.class.name,
      academicYear: filters.data.academicYearId,
      filters: {
        subject: subjectId ? (await prisma.subject.findUnique({ where: { id: parseInt(subjectId) } }))?.name : 'All',
        status: statusFilter || 'All',
        startDate: startDate || 'N/A',
        endDate: endDate || 'N/A',
      },
      overview: {
        totalHomeworks,
        submittedCount,
        lateCount,
        missedCount,
        pendingCount,
        childCompletionRate,
        onTimeRate,
        classAverageCompletionRate,
        averageGrade,
      },
      records: homeworks.map(hw => ({
        title: hw.title,
        subject: hw.subject.name,
        teacher: `${hw.teacher.firstName} ${hw.teacher.lastName}`,
        assignedDate: hw.assignedDate.toISOString().split('T')[0],
        dueDate: hw.dueDate.toISOString().split('T')[0],
        status: hw.submissions.length > 0 ? hw.submissions[0].status : (new Date() > hw.dueDate ? 'MISSED' : 'PENDING'),
        submissionDate: hw.submissions.length > 0 && hw.submissions[0].submissionDate 
          ? hw.submissions[0].submissionDate.toISOString().split('T')[0] 
          : 'N/A',
        grade: hw.submissions.length > 0 && hw.submissions[0].grade !== null ? hw.submissions[0].grade : 'N/A',
        feedback: hw.submissions.length > 0 ? hw.submissions[0].feedback || 'No feedback' : 'N/A',
        isLate: hw.submissions.length > 0 ? hw.submissions[0].isLate : false,
      })),
    };

    let fileBuffer: Buffer;
    let contentType: string;
    let fileName: string;

    if (format === 'pdf') {
      fileBuffer = await generatePdfReport(reportData, 'parent-homework');
      contentType = 'application/pdf';
      fileName = `homework_report_${selectedChild.firstName}_${selectedChild.lastName}.pdf`;
    } else if (format === 'excel') {
      fileBuffer = await generateExcelReport(reportData, 'parent-homework');
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileName = `homework_report_${selectedChild.firstName}_${selectedChild.lastName}.xlsx`;
    } else {
      return new NextResponse('Invalid format specified', { status: 400 });
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('[PARENT_HOMEWORK_EXPORT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
