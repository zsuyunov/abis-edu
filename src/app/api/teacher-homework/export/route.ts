import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const teacherId = url.searchParams.get("teacherId") || session.id;
    const homeworkId = url.searchParams.get("homeworkId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const format = url.searchParams.get("format") || "pdf"; // pdf or excel
    const reportType = url.searchParams.get("reportType") || "detailed"; // detailed, summary, analytics
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Verify teacher can only export their own homework data
    if (session.id !== teacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get teacher information with assignments
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        TeacherAssignment: {
          where: { status: "ACTIVE" },
          include: {
            Branch: true,
          },
        },
      },
    });

    if (!teacher || teacher.TeacherAssignment.length === 0) {
      return NextResponse.json({ error: "Teacher not found or no active assignments" }, { status: 404 });
    }

    // Get the teacher's branch from their assignment
    const teacherBranch = teacher.TeacherAssignment[0].Branch;
    const branchId = teacher.TeacherAssignment[0].branchId;

    // Build filter conditions
    const homeworkWhere: any = {
      teacherId,
      branchId, // Always filter by teacher's branch
    };

    if (homeworkId) homeworkWhere.id = parseInt(homeworkId);
    if (classId) homeworkWhere.classId = parseInt(classId);
    if (subjectId) homeworkWhere.subjectId = parseInt(subjectId);

    if (startDate && endDate) {
      homeworkWhere.assignedDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get homework data with submissions
    const homework = await prisma.homework.findMany({
      where: homeworkWhere,
      include: {
        subject: true,
        class: {
          include: {
            students: {
              where: {
                status: "ACTIVE",
                branchId: branchId,
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
        },
        academicYear: true,
        branch: true,
        attachments: true,
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
            attachments: true,
          },
        },
      },
      orderBy: [
        { assignedDate: "desc" },
      ],
    });

    if (homework.length === 0) {
      return NextResponse.json({ error: "No homework data found for export" }, { status: 404 });
    }

    // Generate export based on format
    if (format === "pdf") {
      return generateHomeworkPDF({
        teacher,
        teacherBranch,
        homework,
        reportType,
        startDate,
        endDate,
        classId,
        subjectId,
      });
    } else if (format === "excel") {
      return generateHomeworkExcel({
        teacher,
        teacherBranch,
        homework,
        reportType,
        startDate,
        endDate,
        classId,
        subjectId,
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (error) {
    console.error("Error exporting homework data:", error);
    return NextResponse.json(
      { error: "Failed to export homework data" },
      { status: 500 }
    );
  }
}

async function generateHomeworkPDF(data: any) {
  const { teacher, teacherBranch, homework, reportType, startDate, endDate, classId, subjectId } = data;
  
  // Calculate overall statistics
  const totalHomework = homework.length;
  const totalSubmissions = homework.reduce((sum: number, hw: any) => 
    sum + hw.submissions.filter((s: any) => s.status === "SUBMITTED" || s.status === "GRADED").length, 0
  );
  const totalStudents = homework.reduce((sum: number, hw: any) => sum + hw.class.students.length, 0);
  const averageSubmissionRate = totalStudents > 0 ? Math.round((totalSubmissions / totalStudents) * 100) : 0;

  // Calculate grade statistics
  const allGradedSubmissions = homework.flatMap((hw: any) => 
    hw.submissions.filter((s: any) => s.grade !== null && s.grade !== undefined)
  );
  const averageGrade = allGradedSubmissions.length > 0 ? 
    Math.round(allGradedSubmissions.reduce((sum: number, s: any) => sum + s.grade, 0) / allGradedSubmissions.length) : 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Homework Report - ${teacher.firstName} ${teacher.lastName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
        .teacher-info { background: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-section { background: white; padding: 15px; border-radius: 6px; border: 1px solid #93c5fd; }
        .summary { background: #f0f9ff; padding: 25px; border-radius: 8px; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .stat-card { text-align: center; background: white; padding: 20px; border-radius: 8px; border: 2px solid #e0f2fe; }
        .stat-number { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 14px; color: #64748b; }
        .homework-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .homework-table th, .homework-table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
        .homework-table th { background: #3b82f6; color: white; font-weight: bold; }
        .homework-table tr:nth-child(even) { background: #f9fafb; }
        .status-active { color: #059669; font-weight: bold; }
        .status-expired { color: #dc2626; font-weight: bold; }
        .status-archived { color: #6b7280; font-weight: bold; }
        .section-header { background: #f3f4f6; padding: 15px; font-weight: bold; color: #374151; border-radius: 6px; margin: 20px 0 10px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📚 Teacher Homework Report</h1>
        <h2>${teacher.firstName} ${teacher.lastName} (${teacher.teacherId})</h2>
        <p><strong>Branch:</strong> ${teacherBranch.shortName} - ${teacherBranch.legalName}</p>
        ${startDate && endDate ? `<p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>` : ""}
        <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "long", 
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}</p>
      </div>

      <div class="teacher-info">
        <div class="info-section">
          <div style="font-weight: bold; color: #1e40af; margin-bottom: 10px;">Teacher Information</div>
          <div><strong>Name:</strong> ${teacher.firstName} ${teacher.lastName}</div>
          <div><strong>Teacher ID:</strong> ${teacher.teacherId}</div>
          <div><strong>Branch:</strong> ${teacherBranch.legalName}</div>
        </div>
        <div class="info-section">
          <div style="font-weight: bold; color: #1e40af; margin-bottom: 10px;">Report Summary</div>
          <div><strong>Total Homework:</strong> ${totalHomework}</div>
          <div><strong>Report Type:</strong> ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}</div>
          <div><strong>Date Range:</strong> ${startDate && endDate ? 
            `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : 
            "All available data"}</div>
        </div>
      </div>

      <div class="summary">
        <div style="font-size: 20px; font-weight: bold; color: #0c4a6e; margin-bottom: 20px; text-align: center;">📊 Overall Statistics</div>
        <div class="summary-grid">
          <div class="stat-card">
            <div class="stat-number" style="color: #3b82f6;">${totalHomework}</div>
            <div class="stat-label">Total Homework</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" style="color: #059669;">${totalSubmissions}</div>
            <div class="stat-label">Total Submissions</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" style="color: #d97706;">${averageSubmissionRate}%</div>
            <div class="stat-label">Avg Submission Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" style="color: #7c3aed;">${averageGrade}%</div>
            <div class="stat-label">Average Grade</div>
          </div>
        </div>
      </div>

      ${reportType === "detailed" ? `
      <div class="section-header">📋 Detailed Homework List</div>
      
      ${homework.map((hw: any) => {
        const submittedCount = hw.submissions.filter((s: any) => s.status === "SUBMITTED" || s.status === "GRADED").length;
        const lateCount = hw.submissions.filter((s: any) => s.isLate).length;
        const gradedCount = hw.submissions.filter((s: any) => s.status === "GRADED").length;
        const submissionRate = hw.class.students.length > 0 ? Math.round((submittedCount / hw.class.students.length) * 100) : 0;
        
        return `
          <div style="margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa;">
            <h3 style="color: #374151; margin-bottom: 15px;">${hw.title}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
              <div>
                <div><strong>Subject:</strong> ${hw.subject.name}</div>
                <div><strong>Class:</strong> ${hw.class.name}</div>
                <div><strong>Assigned:</strong> ${new Date(hw.assignedDate).toLocaleDateString()}</div>
                <div><strong>Due:</strong> ${new Date(hw.dueDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div><strong>Status:</strong> <span class="status-${hw.status.toLowerCase()}">${hw.status}</span></div>
                <div><strong>Total Points:</strong> ${hw.totalPoints || "Not set"}</div>
                <div><strong>Late Submission:</strong> ${hw.allowLateSubmission ? "Allowed" : "Not allowed"}</div>
                <div><strong>Attachments:</strong> ${hw.attachments.length}</div>
              </div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 6px;">
              <div style="font-weight: bold; margin-bottom: 10px;">Submission Statistics:</div>
              <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
                <div style="text-align: center;">
                  <div style="font-size: 18px; font-weight: bold; color: #3b82f6;">${hw.class.students.length}</div>
                  <div style="font-size: 12px; color: #6b7280;">Total Students</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 18px; font-weight: bold; color: #059669;">${submittedCount}</div>
                  <div style="font-size: 12px; color: #6b7280;">Submitted</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 18px; font-weight: bold; color: #dc2626;">${lateCount}</div>
                  <div style="font-size: 12px; color: #6b7280;">Late</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 18px; font-weight: bold; color: #7c3aed;">${gradedCount}</div>
                  <div style="font-size: 12px; color: #6b7280;">Graded</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 18px; font-weight: bold; color: #d97706;">${submissionRate}%</div>
                  <div style="font-size: 12px; color: #6b7280;">Rate</div>
                </div>
              </div>
            </div>
            
            ${hw.description ? `<div style="margin-top: 15px;"><strong>Description:</strong> ${hw.description}</div>` : ""}
            ${hw.instructions ? `<div style="margin-top: 10px;"><strong>Instructions:</strong> ${hw.instructions}</div>` : ""}
          </div>
        `;
      }).join("")}
      ` : ""}

      ${reportType === "analytics" ? `
      <div class="section-header">📈 Performance Analytics</div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h4 style="color: #374151; margin-bottom: 15px;">Subject Performance</h4>
          ${Array.from(new Set(homework.map((hw: any) => hw.subject.name))).map(subjectName => {
            const subjectHomework = homework.filter((hw: any) => hw.subject.name === subjectName);
            const subjectSubmissions = subjectHomework.reduce((sum: number, hw: any) => 
              sum + hw.submissions.filter((s: any) => s.status === "SUBMITTED" || s.status === "GRADED").length, 0
            );
            const subjectStudents = subjectHomework.reduce((sum: number, hw: any) => sum + hw.class.students.length, 0);
            const subjectRate = subjectStudents > 0 ? Math.round((subjectSubmissions / subjectStudents) * 100) : 0;
            
            return `
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 4px;">
                <span>${subjectName}</span>
                <span style="font-weight: bold; color: #3b82f6;">${subjectRate}%</span>
              </div>
            `;
          }).join("")}
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h4 style="color: #374151; margin-bottom: 15px;">Class Performance</h4>
          ${Array.from(new Set(homework.map((hw: any) => hw.class.name))).map(className => {
            const classHomework = homework.filter((hw: any) => hw.class.name === className);
            const classSubmissions = classHomework.reduce((sum: number, hw: any) => 
              sum + hw.submissions.filter((s: any) => s.status === "SUBMITTED" || s.status === "GRADED").length, 0
            );
            const classStudents = classHomework.reduce((sum: number, hw: any) => sum + hw.class.students.length, 0);
            const classRate = classStudents > 0 ? Math.round((classSubmissions / classStudents) * 100) : 0;
            
            return `
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 4px;">
                <span>${className}</span>
                <span style="font-weight: bold; color: #059669;">${classRate}%</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
      ` : ""}

      <div class="footer">
        <p>This homework report was generated for ${teacher.firstName} ${teacher.lastName} from ${teacherBranch.shortName}.</p>
        <p>Report includes${startDate && endDate ? ` homework assigned from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : " all homework assignments"}.</p>
        <p style="margin-top: 15px; font-style: italic;">Keep up the great work in engaging students with meaningful homework assignments! 📚✨</p>
      </div>
    </body>
    </html>
  `;

  const response = new NextResponse(htmlContent);
  response.headers.set("Content-Type", "text/html");
  response.headers.set("Content-Disposition", `attachment; filename="homework_report_${teacher.lastName}_${reportType}.html"`);
  
  return response;
}

async function generateHomeworkExcel(data: any) {
  const { teacher, teacherBranch, homework, reportType, startDate, endDate, classId, subjectId } = data;
  
  // Calculate overall statistics
  const totalHomework = homework.length;
  const totalSubmissions = homework.reduce((sum: number, hw: any) => 
    sum + hw.submissions.filter((s: any) => s.status === "SUBMITTED" || s.status === "GRADED").length, 0
  );
  const totalStudents = homework.reduce((sum: number, hw: any) => sum + hw.class.students.length, 0);
  const averageSubmissionRate = totalStudents > 0 ? Math.round((totalSubmissions / totalStudents) * 100) : 0;

  // Generate CSV content (Excel-compatible)
  const csvRows = [
    // Header information
    [`Teacher Homework Report - ${teacher.firstName} ${teacher.lastName}`],
    [`Teacher ID: ${teacher.teacherId}`],
    [`Branch: ${teacherBranch.shortName} - ${teacherBranch.legalName}`],
    [`Period: ${startDate ? new Date(startDate).toLocaleDateString() : "All"} - ${endDate ? new Date(endDate).toLocaleDateString() : "All"}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [""], // Empty row
    
    // Summary section
    ["HOMEWORK SUMMARY"],
    ["Metric", "Value"],
    ["Total Homework Assignments", totalHomework],
    ["Total Submissions Received", totalSubmissions],
    ["Average Submission Rate", `${averageSubmissionRate}%`],
    [""], // Empty row
    
    // Homework list
    ["HOMEWORK ASSIGNMENTS"],
    ["Title", "Subject", "Class", "Assigned Date", "Due Date", "Status", "Total Points", "Students", "Submitted", "Late", "Graded", "Submission Rate"],
    
    // Homework data
    ...homework.map((hw: any) => {
      const submittedCount = hw.submissions.filter((s: any) => s.status === "SUBMITTED" || s.status === "GRADED").length;
      const lateCount = hw.submissions.filter((s: any) => s.isLate).length;
      const gradedCount = hw.submissions.filter((s: any) => s.status === "GRADED").length;
      const submissionRate = hw.class.students.length > 0 ? Math.round((submittedCount / hw.class.students.length) * 100) : 0;
      
      return [
        hw.title,
        hw.subject.name,
        hw.class.name,
        new Date(hw.assignedDate).toLocaleDateString(),
        new Date(hw.dueDate).toLocaleDateString(),
        hw.status,
        hw.totalPoints || "Not set",
        hw.class.students.length,
        submittedCount,
        lateCount,
        gradedCount,
        `${submissionRate}%`,
      ];
    }),

    [""], // Empty row
    
    // Detailed submissions if requested
    ...(reportType === "detailed" ? [
      ["DETAILED SUBMISSIONS"],
      ["Homework", "Student ID", "Student Name", "Submission Date", "Status", "Grade", "Is Late", "Feedback"],
      
      ...homework.flatMap((hw: any) => 
        hw.submissions.map((submission: any) => [
          hw.title,
          submission.student.studentId,
          `${submission.student.firstName} ${submission.student.lastName}`,
          submission.submissionDate ? new Date(submission.submissionDate).toLocaleDateString() : "Not submitted",
          submission.status,
          submission.grade || "Not graded",
          submission.isLate ? "Yes" : "No",
          submission.feedback || "",
        ])
      ),
      
      [""], // Empty row
    ] : []),
    
    // Analytics if requested
    ...(reportType === "analytics" ? [
      ["PERFORMANCE ANALYTICS"],
      ["Subject", "Homework Count", "Total Submissions", "Submission Rate"],
      
      ...Array.from(new Set(homework.map((hw: any) => hw.subject.name))).map(subjectName => {
        const subjectHomework = homework.filter((hw: any) => hw.subject.name === subjectName);
        const subjectSubmissions = subjectHomework.reduce((sum: number, hw: any) => 
          sum + hw.submissions.filter((s: any) => s.status === "SUBMITTED" || s.status === "GRADED").length, 0
        );
        const subjectStudents = subjectHomework.reduce((sum: number, hw: any) => sum + hw.class.students.length, 0);
        const subjectRate = subjectStudents > 0 ? Math.round((subjectSubmissions / subjectStudents) * 100) : 0;
        
        return [subjectName, subjectHomework.length, subjectSubmissions, `${subjectRate}%`];
      }),
      
      [""], // Empty row
      
      ["Class", "Homework Count", "Total Submissions", "Submission Rate"],
      
      ...Array.from(new Set(homework.map((hw: any) => hw.class.name))).map(className => {
        const classHomework = homework.filter((hw: any) => hw.class.name === className);
        const classSubmissions = classHomework.reduce((sum: number, hw: any) => 
          sum + hw.submissions.filter((s: any) => s.status === "SUBMITTED" || s.status === "GRADED").length, 0
        );
        const classStudents = classHomework.reduce((sum: number, hw: any) => sum + hw.class.students.length, 0);
        const classRate = classStudents > 0 ? Math.round((classSubmissions / classStudents) * 100) : 0;
        
        return [className, classHomework.length, classSubmissions, `${classRate}%`];
      }),
    ] : []),
  ];

  // Convert to CSV format
  const csvContent = csvRows
    .map(row => 
      row.map((cell: any) => 
        typeof cell === "string" && (cell.includes(",") || cell.includes('"')) 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(",")
    )
    .join("\n");

  const response = new NextResponse(csvContent);
  response.headers.set("Content-Type", "text/csv");
  response.headers.set("Content-Disposition", `attachment; filename="homework_report_${teacher.lastName}_${reportType}.csv"`);
  
  return response;
}
