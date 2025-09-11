import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { homeworkSchema, homeworkFilterSchema } from "@/lib/formValidationSchemas";

export async function GET(request: NextRequest) {
  try {
    // Try header-based auth first, then fallback to token auth
    const teacherId = request.headers.get('x-user-id');
    let authenticatedUserId = teacherId;

    if (!teacherId) {
      const authHeader = request.headers.get('authorization');
      const token = AuthService.extractTokenFromHeader(authHeader);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const session = AuthService.verifyToken(token);
      if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authenticatedUserId = session.id;
    }

    const url = new URL(request.url);
    const requestedTeacherId = url.searchParams.get("teacherId") || authenticatedUserId;
    
    console.log('API Debug - Header teacherId:', teacherId);
    console.log('API Debug - Authenticated userId:', authenticatedUserId);
    console.log('API Debug - Requested teacherId from params:', url.searchParams.get("teacherId"));
    console.log('API Debug - Final teacherId being used:', requestedTeacherId);
    console.log('API Debug - TeacherId type:', typeof requestedTeacherId);
    console.log('API Debug - TeacherId value:', JSON.stringify(requestedTeacherId));
    const branchId = url.searchParams.get("branchId");
    const academicYearId = url.searchParams.get("academicYearId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const status = url.searchParams.get("status") || "ALL";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const view = url.searchParams.get("view") || "list"; // list, analytics, export

    // Verify teacher can only access their own homework
    if (authenticatedUserId !== requestedTeacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get teacher information
    const teacher = await prisma.teacher.findUnique({
      where: { id: requestedTeacherId || undefined },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Auto-expire homework that has passed the due date
    const now = new Date();
    await prisma.homework.updateMany({
      where: {
        teacherId: requestedTeacherId || undefined,
        dueDate: {
          lt: now
        },
        status: 'ACTIVE'
      },
      data: {
        status: 'EXPIRED',
        updatedAt: now
      }
    });

    // Get teacher assignments to determine access
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: requestedTeacherId || undefined,
        status: "ACTIVE",
      },
    });

    console.log('Teacher assignments found:', teacherAssignments.length);
    console.log('Teacher assignments:', teacherAssignments);

    // Note: We allow homework to be shown even if teacher has no formal assignments
    // This is because homework can be created directly without requiring assignments

    // Get unique branch IDs from assignments
    const teacherBranchIds = Array.from(new Set(teacherAssignments.map(a => a.branchId)));
    console.log('Teacher branch IDs:', teacherBranchIds);
    
    // Get classes and subjects from assignments
    const classIds = Array.from(new Set(teacherAssignments.map(a => a.classId)));
    const subjectIds = Array.from(new Set(teacherAssignments.map(a => a.subjectId).filter(Boolean)));
    
    // Get full class and subject data
    const assignedClasses = await prisma.class.findMany({
      where: { id: { in: classIds } },
      include: {
        academicYear: true,
        branch: true,
      },
    });
    
    const assignedSubjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds as number[] } },
    });
    
    // Get available academic years from assigned classes
    const availableAcademicYears = Array.from(new Set(assignedClasses.map(c => c.academicYear)))
      .filter(Boolean)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    // Build homework query filters
    const homeworkFilters: any = {
      teacherId: requestedTeacherId,
    };
    
    // Only filter by branch if teacher has assignments
    if (teacherBranchIds.length > 0) {
      homeworkFilters.branchId = { in: teacherBranchIds };
    }

    // Only filter by academic year if explicitly requested
    if (academicYearId && academicYearId !== "undefined" && academicYearId !== "") {
      homeworkFilters.academicYearId = parseInt(academicYearId);
      console.log('Filtering by specific academic year:', academicYearId);
    } else {
      // Don't filter by academic year if not specified - show all homework
      console.log('No academic year filter specified - showing all homework for teacher');
    }

    console.log('Academic year filter being applied:', homeworkFilters.academicYearId);
    console.log('Available academic years from assignments:', availableAcademicYears.map(y => ({ id: y.id, name: y.name })));
    if (classId && classId !== "undefined") {
      homeworkFilters.classId = parseInt(classId);
    }
    if (subjectId && subjectId !== "undefined") {
      homeworkFilters.subjectId = parseInt(subjectId);
    }

    // Apply status filter
    if (status && status !== "ALL") {
      homeworkFilters.status = status;
    } else {
      // Show only ACTIVE and EXPIRED homework by default, exclude ARCHIVED
      homeworkFilters.status = { in: ['ACTIVE', 'EXPIRED'] };
    }

    if (startDate && endDate) {
      homeworkFilters.assignedDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get homework records with related data and submission counts
    console.log('Fetching homework with filters:', homeworkFilters);
    
    const homework = await prisma.homework.findMany({
      where: homeworkFilters,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            shortName: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileType: true,
            fileUrl: true,
            fileSize: true,
            duration: true,
            mimeType: true,
          },
        },
        submissions: {
          select: {
            id: true,
            status: true,
            submissionDate: true,
            isLate: true,
            grade: true,
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: [
        { assignedDate: "desc" },
        { createdAt: "desc" },
      ],
    });

        console.log('Found homework records:', homework.length);
        console.log('Homework IDs:', homework.map(h => h.id));
        console.log('Homework details:', homework.map(h => ({
          id: h.id,
          title: h.title,
          teacherId: h.teacherId,
          classId: h.classId,
          subjectId: h.subjectId,
          status: h.status,
          createdAt: h.createdAt,
          branchId: h.branchId,
          academicYearId: h.academicYearId
        })));

        // Debug: Check what academic years exist in the database
        const allAcademicYears = await prisma.academicYear.findMany({
          select: { id: true, name: true, isCurrent: true, status: true, startDate: true, endDate: true }
        });
        console.log('All academic years in database:', allAcademicYears);
        
        // Also check if any homework exists for this teacher without filters
        const allHomeworkForTeacher = await prisma.homework.findMany({
          where: { teacherId: requestedTeacherId || undefined },
          select: { id: true, title: true, status: true, createdAt: true }
        });
        console.log('All homework for teacher (no filters):', allHomeworkForTeacher.length);
        console.log('All homework details:', allHomeworkForTeacher);

    // Calculate submission statistics for each homework
    const homeworkWithStats = await Promise.all(homework.map(async (hw) => {
      // Get actual enrolled student count for this class and branch
      const totalStudents = await prisma.student.count({
        where: {
          classId: hw.classId,
          branchId: hw.branchId,
          status: "ACTIVE",
        },
      });
      
      const submissions = hw.submissions;
      const submittedCount = submissions.filter(s => s.status === "SUBMITTED" || s.status === "GRADED").length;
      const lateCount = submissions.filter(s => s.isLate).length;
      const notSubmittedCount = totalStudents - submittedCount;
      const gradedCount = submissions.filter(s => s.status === "GRADED").length;
      
      const submissionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
      const onTimeRate = submittedCount > 0 ? Math.round(((submittedCount - lateCount) / submittedCount) * 100) : 0;
      const gradingProgress = submittedCount > 0 ? Math.round((gradedCount / submittedCount) * 100) : 0;

      return {
        ...hw,
        stats: {
          totalStudents,
          submittedCount,
          lateCount,
          notSubmittedCount,
          gradedCount,
          submissionRate,
          onTimeRate,
          gradingProgress,
        },
      };
    }));

    if (view === "analytics") {
      // Analytics view - get summary statistics
      const totalHomework = await prisma.homework.count({
        where: homeworkFilters,
      });

      const completedHomework = await prisma.homework.count({
        where: {
          ...homeworkFilters,
          status: "COMPLETED",
        },
      });

      const pendingHomework = totalHomework - completedHomework;

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            total: totalHomework,
            completed: completedHomework,
            pending: pendingHomework,
            completionRate: totalHomework > 0 ? (completedHomework / totalHomework) * 100 : 0,
          },
          availableAcademicYears,
          assignedClasses,
          assignedSubjects,
          filters: {
            academicYearId,
            classId,
            subjectId,
            status,
            startDate,
            endDate,
          },
        },
      });
    }

    // Calculate overall statistics
    const overallStats = calculateOverallStats(homeworkWithStats);

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        teacherId: teacher.teacherId,
        email: teacher.email,
        phone: teacher.phone,
      },
      homework: homeworkWithStats,
      overallStats,
      availableAcademicYears,
      assignedClasses,
      assignedSubjects,
      filters: {
        academicYearId,
        classId,
        subjectId,
        status,
        startDate,
        endDate,
      },
    });

  } catch (error) {
    console.error("Error fetching teacher homework:", error);
    return NextResponse.json(
      { error: "Failed to fetch homework data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try header-based auth first, then fallback to token auth
    const teacherId = request.headers.get('x-user-id');
    let authenticatedUserId = teacherId;

    if (!teacherId) {
      const authHeader = request.headers.get('authorization');
      const token = AuthService.extractTokenFromHeader(authHeader);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const session = AuthService.verifyToken(token);
      if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authenticatedUserId = session.id;
    }

    // Check if request is FormData (for file uploads) or JSON
    const contentType = request.headers.get('content-type');
    let body: any;
    let attachmentFiles: File[] = [];

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData for file uploads
      const formData = await request.formData();
      
      // Extract form fields
      body = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        fullMark: parseInt(formData.get('fullMark') as string) || 100,
        passingMark: parseInt(formData.get('passingMark') as string) || 60,
        startDate: formData.get('startDate') as string,
        startTime: formData.get('startTime') as string,
        submissionDate: formData.get('submissionDate') as string,
        submissionTime: formData.get('submissionTime') as string,
        allowLateSubmission: formData.get('allowLateSubmission') === 'true',
        latePenalty: parseInt(formData.get('latePenalty') as string) || 0,
        timetableId: formData.get('timetableId') as string,
        classId: parseInt(formData.get('classId') as string),
        subjectId: parseInt(formData.get('subjectId') as string),
        academicYearId: parseInt(formData.get('academicYearId') as string),
        branchId: parseInt(formData.get('branchId') as string),
      };

      // Extract attachment files
      const attachments = formData.getAll('attachments') as File[];
      const attachmentTypes = formData.getAll('attachmentTypes') as string[];
      
      attachmentFiles = attachments.filter(file => file.size > 0);
      
      console.log('FormData received:', {
        title: body.title,
        attachmentCount: attachmentFiles.length,
        attachmentTypes: attachmentTypes
      });
    } else {
      // Handle JSON request (backward compatibility)
      body = await request.json();
    }
    
    // Verify teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: authenticatedUserId || undefined },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Create start and due dates from separate date and time fields
    const startDateTime = new Date(`${body.startDate}T${body.startTime}`);
    const dueDateTime = new Date(`${body.submissionDate}T${body.submissionTime}`);

    // Create homework with new structure
    const homework = await prisma.homework.create({
      data: {
        title: body.title,
        description: body.description,
        instructions: body.description, // Use description as instructions for now
        assignedDate: startDateTime,
        dueDate: dueDateTime,
        status: 'ACTIVE',
        totalPoints: body.fullMark,
        passingGrade: body.passingMark,
        allowLateSubmission: body.allowLateSubmission,
        latePenalty: body.latePenalty,
        branchId: body.branchId,
        academicYearId: body.academicYearId,
        classId: body.classId,
        subjectId: body.subjectId,
        teacherId: authenticatedUserId || "",
      },
      include: {
        subject: true,
        class: true,
        academicYear: true,
        branch: true,
      },
    });

    // Handle file attachments if provided
    if (attachmentFiles.length > 0) {
      // Create a simple file storage directory (in production, use cloud storage)
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'homework');
      
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Process each attachment file
      for (let i = 0; i < attachmentFiles.length; i++) {
        const file = attachmentFiles[i];
        const fileExtension = path.extname(file.name);
        const fileName = `${homework.id}_${Date.now()}_${i}${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);
        
        // Save file to disk
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        
        // Determine file type
        let fileType = 'DOCUMENT';
        if (file.type.startsWith('image/')) fileType = 'IMAGE';
        else if (file.type.startsWith('audio/')) fileType = 'VOICE';
        
        // Create attachment record
        await prisma.homeworkAttachment.create({
          data: {
            homeworkId: homework.id,
            fileName: fileName,
            originalName: file.name,
            fileType: fileType as any,
            filePath: `/uploads/homework/${fileName}`,
            fileUrl: `/uploads/homework/${fileName}`,
            fileSize: file.size,
            mimeType: file.type,
          },
        });
      }
    }

    // Create submission records for all students in the class
    const studentsInClass = await prisma.student.findMany({
      where: {
        classId: body.classId,
        branchId: body.branchId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (studentsInClass.length > 0) {
      await prisma.homeworkSubmission.createMany({
        data: studentsInClass.map(student => ({
          homeworkId: homework.id,
          studentId: student.id,
          status: "NOT_SUBMITTED",
        })),
      });
    }

    return NextResponse.json({
      success: true,
      homework,
      message: `Homework "${homework.title}" created successfully for ${studentsInClass.length} students`,
    });

  } catch (error) {
    console.error("Error creating homework:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create homework" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Homework ID is required" }, { status: 400 });
    }

    // Validate the homework data
    const validatedData = homeworkSchema.parse({
      ...updateData,
      teacherId: session.id,
    });

    // Verify homework exists and belongs to teacher
    const existingHomework = await prisma.homework.findUnique({
      where: { id: parseInt(id) },
      include: {
        teacher: true,
      },
    });

    if (!existingHomework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    if (existingHomework.teacherId !== session.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update homework
    const updatedHomework = await prisma.homework.update({
      where: { id: parseInt(id) },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        assignedDate: validatedData.assignedDate,
        dueDate: validatedData.dueDate,
        status: validatedData.status,
        totalPoints: validatedData.totalPoints,
        passingGrade: validatedData.passingGrade,
        allowLateSubmission: validatedData.allowLateSubmission,
        latePenalty: validatedData.latePenalty,
      },
      include: {
        subject: true,
        class: true,
        academicYear: true,
        branch: true,
        attachments: true,
      },
    });

    return NextResponse.json({
      success: true,
      homework: updatedHomework,
      message: "Homework updated successfully",
    });

  } catch (error) {
    console.error("Error updating homework:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update homework" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Try header-based auth first, then fallback to token auth
    const teacherId = request.headers.get('x-user-id');
    let authenticatedUserId = teacherId;

    if (!teacherId) {
      const authHeader = request.headers.get('authorization');
      const token = AuthService.extractTokenFromHeader(authHeader);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const session = AuthService.verifyToken(token);
      if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authenticatedUserId = session.id;
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const action = url.searchParams.get("action"); // 'delete', 'archive', 'restore'

    if (!id) {
      return NextResponse.json({ error: "Homework ID is required" }, { status: 400 });
    }

    // Verify homework exists and belongs to teacher
    const homework = await prisma.homework.findUnique({
      where: { id: parseInt(id) },
      include: {
        submissions: {
          where: {
            status: {
              in: ["SUBMITTED", "GRADED"],
            },
          },
        },
      },
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    if (homework.teacherId !== authenticatedUserId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let updatedHomework;
    let message;

    if (action === 'archive') {
      // Archive homework (set status to ARCHIVED)
      updatedHomework = await prisma.homework.update({
        where: { id: parseInt(id) },
        data: { 
          status: 'ARCHIVED',
          archivedAt: new Date(),
        },
      });
      message = "Homework archived successfully";
    } else if (action === 'restore') {
      // Restore homework (set status to ACTIVE)
      updatedHomework = await prisma.homework.update({
        where: { id: parseInt(id) },
        data: { 
          status: 'ACTIVE',
          archivedAt: null,
          restoredAt: new Date(),
        },
      });
      message = "Homework restored successfully";
    } else {
      // Delete homework permanently
      // Check if homework has submissions
      if (homework.submissions.length > 0) {
        return NextResponse.json({ 
          error: "Cannot delete homework with existing submissions. Archive it instead." 
        }, { status: 400 });
      }

      await prisma.homework.delete({
        where: { id: parseInt(id) },
      });
      message = "Homework deleted successfully";
    }

    return NextResponse.json({
      success: true,
      message,
      homework: updatedHomework || null,
    });

  } catch (error) {
    console.error("Error deleting homework:", error);
    return NextResponse.json(
      { error: "Failed to delete homework" },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateOverallStats(homework: any[]) {
  if (homework.length === 0) {
    return {
      totalHomework: 0,
      totalSubmissions: 0,
      averageSubmissionRate: 0,
      averageOnTimeRate: 0,
      averageGradingProgress: 0,
      upcomingDeadlines: 0,
      overdueCount: 0,
    };
  }

  const totalHomework = homework.length;
  const totalSubmissions = homework.reduce((sum, hw) => sum + hw.stats.submittedCount, 0);
  const averageSubmissionRate = Math.round(
    homework.reduce((sum, hw) => sum + hw.stats.submissionRate, 0) / totalHomework
  );
  const averageOnTimeRate = Math.round(
    homework.reduce((sum, hw) => sum + hw.stats.onTimeRate, 0) / totalHomework
  );
  const averageGradingProgress = Math.round(
    homework.reduce((sum, hw) => sum + hw.stats.gradingProgress, 0) / totalHomework
  );

  const today = new Date();
  const upcomingDeadlines = homework.filter(hw => 
    new Date(hw.dueDate) > today && new Date(hw.dueDate) <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  ).length;
  
  const overdueCount = homework.filter(hw => 
    new Date(hw.dueDate) < today && hw.status === "ACTIVE"
  ).length;

  return {
    totalHomework,
    totalSubmissions,
    averageSubmissionRate,
    averageOnTimeRate,
    averageGradingProgress,
    upcomingDeadlines,
    overdueCount,
  };
}

async function getTeacherHomeworkAnalytics(homework: any[], teacher: any, filters: any) {
  const analytics = {
    overallStats: calculateOverallStats(homework),
    submissionTrends: calculateSubmissionTrends(homework),
    subjectPerformance: calculateSubjectPerformance(homework),
    classPerformance: calculateClassPerformance(homework),
    deadlineAnalysis: calculateDeadlineAnalysis(homework),
    insights: generateTeacherInsights(homework),
  };

  return NextResponse.json({
    teacher,
    analytics,
    filters,
  });
}

function calculateSubmissionTrends(homework: any[]) {
  const trends: Record<string, any> = {};

  homework.forEach(hw => {
    const weekKey = getWeekKey(new Date(hw.assignedDate));
    
    if (!trends[weekKey]) {
      trends[weekKey] = {
        week: weekKey,
        totalHomework: 0,
        totalSubmissions: 0,
        averageSubmissionRate: 0,
      };
    }

    trends[weekKey].totalHomework++;
    trends[weekKey].totalSubmissions += hw.stats.submittedCount;
  });

  // Calculate averages
  return Object.values(trends)
    .map((trend: any) => ({
      ...trend,
      averageSubmissionRate: trend.totalHomework > 0 ? 
        Math.round((trend.totalSubmissions / (trend.totalHomework * 100)) * 100) : 0,
    }))
    .sort((a: any, b: any) => a.week.localeCompare(b.week));
}

function calculateSubjectPerformance(homework: any[]) {
  const subjectPerformance: Record<string, any> = {};

  homework.forEach(hw => {
    const subjectId = hw.subjectId;
    const subjectName = hw.subject.name;
    
    if (!subjectPerformance[subjectId]) {
      subjectPerformance[subjectId] = {
        subject: { id: subjectId, name: subjectName },
        totalHomework: 0,
        totalSubmissions: 0,
        averageSubmissionRate: 0,
        averageOnTimeRate: 0,
      };
    }

    subjectPerformance[subjectId].totalHomework++;
    subjectPerformance[subjectId].totalSubmissions += hw.stats.submittedCount;
  });

  // Calculate averages
  return Object.values(subjectPerformance)
    .map((perf: any) => ({
      ...perf,
      averageSubmissionRate: perf.totalHomework > 0 ? 
        Math.round((perf.totalSubmissions / (perf.totalHomework * 100)) * 100) : 0,
    }))
    .sort((a: any, b: any) => b.averageSubmissionRate - a.averageSubmissionRate);
}

function calculateClassPerformance(homework: any[]) {
  const classPerformance: Record<string, any> = {};

  homework.forEach(hw => {
    const classId = hw.classId;
    const className = hw.class.name;
    
    if (!classPerformance[classId]) {
      classPerformance[classId] = {
        class: { id: classId, name: className },
        totalHomework: 0,
        totalSubmissions: 0,
        averageSubmissionRate: 0,
      };
    }

    classPerformance[classId].totalHomework++;
    classPerformance[classId].totalSubmissions += hw.stats.submittedCount;
  });

  // Calculate averages
  return Object.values(classPerformance)
    .map((perf: any) => ({
      ...perf,
      averageSubmissionRate: perf.totalHomework > 0 ? 
        Math.round((perf.totalSubmissions / (perf.totalHomework * 100)) * 100) : 0,
    }))
    .sort((a: any, b: any) => b.averageSubmissionRate - a.averageSubmissionRate);
}

function calculateDeadlineAnalysis(homework: any[]) {
  const today = new Date();
  const upcomingWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const upcoming = homework.filter(hw => 
    new Date(hw.dueDate) > today && new Date(hw.dueDate) <= upcomingWeek
  );
  
  const overdue = homework.filter(hw => 
    new Date(hw.dueDate) < today && hw.status === "ACTIVE"
  );

  return {
    upcomingDeadlines: upcoming.length,
    overdueHomework: overdue.length,
    upcomingList: upcoming.map(hw => ({
      id: hw.id,
      title: hw.title,
      dueDate: hw.dueDate,
      subject: hw.subject.name,
      class: hw.class.name,
      submissionRate: hw.stats.submissionRate,
    })),
    overdueList: overdue.map(hw => ({
      id: hw.id,
      title: hw.title,
      dueDate: hw.dueDate,
      subject: hw.subject.name,
      class: hw.class.name,
      submissionRate: hw.stats.submissionRate,
    })),
  };
}

function generateTeacherInsights(homework: any[]) {
  const insights: string[] = [];

  if (homework.length === 0) {
    insights.push("📚 Start by creating your first homework assignment!");
    return insights;
  }

  const overallStats = calculateOverallStats(homework);

  // Submission rate insights
  if (overallStats.averageSubmissionRate >= 90) {
    insights.push("🌟 Excellent! Your homework has high submission rates.");
  } else if (overallStats.averageSubmissionRate >= 75) {
    insights.push("👍 Good submission rates. Consider strategies to reach 90%+.");
  } else {
    insights.push("📈 Focus on improving submission rates. Try shorter assignments or clearer instructions.");
  }

  // Grading insights
  if (overallStats.averageGradingProgress < 50) {
    insights.push("⏰ Consider prioritizing grading to provide timely feedback to students.");
  } else if (overallStats.averageGradingProgress >= 90) {
    insights.push("✅ Great job staying on top of grading!");
  }

  // Deadline insights
  if (overallStats.overdueCount > 0) {
    insights.push(`📅 You have ${overallStats.overdueCount} overdue homework assignments. Consider extending deadlines or archiving completed work.`);
  }

  if (overallStats.upcomingDeadlines > 3) {
    insights.push("📆 You have several upcoming deadlines. Plan your grading schedule accordingly.");
  }

  return insights;
}

function getWeekKey(date: Date) {
  const year = date.getFullYear();
  const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}
