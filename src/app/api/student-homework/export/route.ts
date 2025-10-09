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
    
    const session = await AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const studentId = session.id;
    const format = url.searchParams.get("format") || "pdf"; // pdf or excel
    const academicYearId = url.searchParams.get("academicYearId");
    const subjectId = url.searchParams.get("subjectId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Get student information
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        branch: true,
        class: {
          include: {
            academicYear: true,
          },
        },
        studentParents: {
          include: {
            parent: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Build filter conditions
    const homeworkWhere: any = {
      branchId: student.branchId,
      classId: student.classId,
      academicYearId: academicYearId ? parseInt(academicYearId) : student.class?.academicYear?.id,
      status: "ACTIVE",
    };

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
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            teacherId: true,
          },
        },
        class: true,
        academicYear: true,
        branch: true,
        submissions: {
          where: {
            studentId: studentId,
          },
          include: {
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

    // Calculate statistics
    const stats = calculateStudentExportStats(homework);

    // Generate export based on format
    if (format === "pdf") {
      return generateStudentHomeworkPDF({
        student,
        homework,
        stats,
        academicYearId,
        subjectId,
        startDate,
        endDate,
      });
    } else if (format === "excel") {
      return generateStudentHomeworkExcel({
        student,
        homework,
        stats,
        academicYearId,
        subjectId,
        startDate,
        endDate,
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (error) {
    console.error("Error exporting student homework data:", error);
    return NextResponse.json(
      { error: "Failed to export homework data" },
      { status: 500 }
    );
  }
}

function calculateStudentExportStats(homework: any[]) {
  const totalHomework = homework.length;
  let completedCount = 0;
  let lateCount = 0;
  let missedCount = 0;
  let pendingCount = 0;
  let totalGrade = 0;
  let gradedCount = 0;

  homework.forEach(hw => {
    const submission = hw.submissions[0];
    const now = new Date();
    const dueDate = new Date(hw.dueDate);
    const isOverdue = now > dueDate;
    
    if (submission) {
      if (submission.status === "GRADED" || submission.status === "SUBMITTED") {
        if (submission.isLate) {
          lateCount++;
        } else {
          completedCount++;
        }
        
        if (submission.grade !== null && submission.grade !== undefined) {
          totalGrade += submission.grade;
          gradedCount++;
        }
      } else {
        if (isOverdue) {
          missedCount++;
        } else {
          pendingCount++;
        }
      }
    } else {
      if (isOverdue) {
        missedCount++;
      } else {
        pendingCount++;
      }
    }
  });

  const completionRate = totalHomework > 0 ? Math.round(((completedCount + lateCount) / totalHomework) * 100) : 0;
  const onTimeRate = (completedCount + lateCount) > 0 ? Math.round((completedCount / (completedCount + lateCount)) * 100) : 0;
  const averageGrade = gradedCount > 0 ? Math.round(totalGrade / gradedCount) : 0;

  return {
    totalHomework,
    completedCount,
    lateCount,
    missedCount,
    pendingCount,
    completionRate,
    onTimeRate,
    averageGrade,
    gradedCount,
  };
}

async function generateStudentHomeworkPDF(data: any) {
  const { student, homework, stats, academicYearId, subjectId, startDate, endDate } = data;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Student Homework Report - ${student.firstName} ${student.lastName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
        .student-info { background: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
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
        .status-completed { color: #059669; font-weight: bold; }
        .status-late { color: #d97706; font-weight: bold; }
        .status-missed { color: #dc2626; font-weight: bold; }
        .status-pending { color: #6b7280; font-weight: bold; }
        .section-header { background: #f3f4f6; padding: 15px; font-weight: bold; color: #374151; border-radius: 6px; margin: 20px 0 10px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; text-align: center; color: #6b7280; font-size: 12px; }
        .grade-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .grade-excellent { background: #dcfce7; color: #166534; }
        .grade-good { background: #dbeafe; color: #1e40af; }
        .grade-fair { background: #fef3c7; color: #92400e; }
        .grade-poor { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📚 Student Homework Report</h1>
        <h2>${student.firstName} ${student.lastName} (${student.studentId})</h2>
        <p><strong>Class:</strong> ${student.class.name} | <strong>Branch:</strong> ${student.branch.shortName}</p>
        ${startDate && endDate ? `<p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>` : ""}
        <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "long", 
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}</p>
      </div>

      <div class="student-info">
        <div class="info-section">
          <div style="font-weight: bold; color: #1e40af; margin-bottom: 10px;">Student Information</div>
          <div><strong>Name:</strong> ${student.firstName} ${student.lastName}</div>
          <div><strong>Student ID:</strong> ${student.studentId}</div>
          <div><strong>Class:</strong> ${student.class.name}</div>
          <div><strong>Academic Year:</strong> ${student.class.academicYear.name}</div>
          <div><strong>Branch:</strong> ${student.branch.legalName}</div>
        </div>
        <div class="info-section">
          <div style="font-weight: bold; color: #1e40af; margin-bottom: 10px;">Parent Information</div>
          <div><strong>Parent:</strong> ${student.parent.firstName} ${student.parent.lastName}</div>
          <div><strong>Report Period:</strong> ${startDate && endDate ? 
            `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : 
            "All available data"}</div>
          <div><strong>Total Homework:</strong> ${stats.totalHomework}</div>
        </div>
      </div>

      <div class="summary">
        <div style="font-size: 20px; font-weight: bold; color: #0c4a6e; margin-bottom: 20px; text-align: center;">📊 Performance Summary</div>
        <div class="summary-grid">
          <div class="stat-card">
            <div class="stat-number" style="color: #3b82f6;">${stats.totalHomework}</div>
            <div class="stat-label">Total Homework</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" style="color: #059669;">${stats.completionRate}%</div>
            <div class="stat-label">Completion Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" style="color: #d97706;">${stats.onTimeRate}%</div>
            <div class="stat-label">On-Time Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" style="color: #7c3aed;">${stats.averageGrade}%</div>
            <div class="stat-label">Average Grade</div>
          </div>
        </div>
        
        <div style="margin-top: 20px;">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center;">
            <div>
              <div style="font-size: 18px; font-weight: bold; color: #059669;">${stats.completedCount}</div>
              <div style="font-size: 12px; color: #6b7280;">Completed</div>
            </div>
            <div>
              <div style="font-size: 18px; font-weight: bold; color: #d97706;">${stats.lateCount}</div>
              <div style="font-size: 12px; color: #6b7280;">Late</div>
            </div>
            <div>
              <div style="font-size: 18px; font-weight: bold; color: #dc2626;">${stats.missedCount}</div>
              <div style="font-size: 12px; color: #6b7280;">Missed</div>
            </div>
            <div>
              <div style="font-size: 18px; font-weight: bold; color: #6b7280;">${stats.pendingCount}</div>
              <div style="font-size: 12px; color: #6b7280;">Pending</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-header">📋 Detailed Homework History</div>
      
      <table class="homework-table">
        <thead>
          <tr>
            <th>Date Assigned</th>
            <th>Subject</th>
            <th>Title</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Grade</th>
            <th>Teacher Feedback</th>
          </tr>
        </thead>
        <tbody>
          ${homework.map((hw: any) => {
            const submission = hw.submissions[0];
            const now = new Date();
            const dueDate = new Date(hw.dueDate);
            const isOverdue = now > dueDate;
            
            let status = "PENDING";
            let statusClass = "status-pending";
            
            if (submission) {
              if (submission.status === "GRADED" || submission.status === "SUBMITTED") {
                status = submission.isLate ? "LATE" : "COMPLETED";
                statusClass = submission.isLate ? "status-late" : "status-completed";
              } else {
                status = isOverdue ? "MISSED" : "PENDING";
                statusClass = isOverdue ? "status-missed" : "status-pending";
              }
            } else {
              status = isOverdue ? "MISSED" : "PENDING";
              statusClass = isOverdue ? "status-missed" : "status-pending";
            }
            
            const grade = submission?.grade;
            let gradeDisplay = "Not graded";
            let gradeClass = "";
            
            if (grade !== null && grade !== undefined) {
              gradeDisplay = `${grade}%`;
              if (grade >= 90) gradeClass = "grade-excellent";
              else if (grade >= 70) gradeClass = "grade-good";
              else if (grade >= 50) gradeClass = "grade-fair";
              else gradeClass = "grade-poor";
            }
            
            return `
              <tr>
                <td>${new Date(hw.assignedDate).toLocaleDateString()}</td>
                <td>${hw.subject.name}</td>
                <td>${hw.title}</td>
                <td>${new Date(hw.dueDate).toLocaleDateString()}</td>
                <td><span class="${statusClass}">${status}</span></td>
                <td>${gradeClass ? `<span class="grade-badge ${gradeClass}">${gradeDisplay}</span>` : gradeDisplay}</td>
                <td>${submission?.feedback || "No feedback yet"}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>

      <div class="section-header">📈 Performance Insights</div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${generateStudentInsights(stats, homework)}
      </div>

      <div class="footer">
        <p>This homework report was generated for ${student.firstName} ${student.lastName} from ${student.class.name}, ${student.branch.shortName}.</p>
        <p>Report includes${startDate && endDate ? ` homework assigned from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : " all homework assignments"}.</p>
        <p style="margin-top: 15px; font-style: italic;">Keep up the excellent work in your studies! 🌟📚</p>
      </div>
    </body>
    </html>
  `;

  const response = new NextResponse(htmlContent);
  response.headers.set("Content-Type", "text/html");
  response.headers.set("Content-Disposition", `attachment; filename="homework_report_${student.lastName}_${student.firstName}.html"`);
  
  return response;
}

async function generateStudentHomeworkExcel(data: any) {
  const { student, homework, stats, academicYearId, subjectId, startDate, endDate } = data;
  
  // Generate CSV content (Excel-compatible)
  const csvRows = [
    // Header information
    [`Student Homework Report - ${student.firstName} ${student.lastName}`],
    [`Student ID: ${student.studentId}`],
    [`Class: ${student.class.name}`],
    [`Branch: ${student.branch.shortName} - ${student.branch.legalName}`],
    [`Academic Year: ${student.class.academicYear.name}`],
    [`Parent: ${student.parent.firstName} ${student.parent.lastName}`],
    [`Period: ${startDate ? new Date(startDate).toLocaleDateString() : "All"} - ${endDate ? new Date(endDate).toLocaleDateString() : "All"}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [""], // Empty row
    
    // Summary section
    ["HOMEWORK PERFORMANCE SUMMARY"],
    ["Metric", "Value"],
    ["Total Homework Assignments", stats.totalHomework],
    ["Completed", stats.completedCount],
    ["Late Submissions", stats.lateCount],
    ["Missed", stats.missedCount],
    ["Pending", stats.pendingCount],
    ["Completion Rate", `${stats.completionRate}%`],
    ["On-Time Rate", `${stats.onTimeRate}%`],
    ["Average Grade", `${stats.averageGrade}%`],
    ["Graded Assignments", stats.gradedCount],
    [""], // Empty row
    
    // Homework list
    ["DETAILED HOMEWORK HISTORY"],
    ["Date Assigned", "Subject", "Title", "Due Date", "Status", "Submission Date", "Grade", "Teacher", "Feedback"],
    
    // Homework data
    ...homework.map((hw: any) => {
      const submission = hw.submissions[0];
      const now = new Date();
      const dueDate = new Date(hw.dueDate);
      const isOverdue = now > dueDate;
      
      let status = "PENDING";
      
      if (submission) {
        if (submission.status === "GRADED" || submission.status === "SUBMITTED") {
          status = submission.isLate ? "LATE" : "COMPLETED";
        } else {
          status = isOverdue ? "MISSED" : "PENDING";
        }
      } else {
        status = isOverdue ? "MISSED" : "PENDING";
      }
      
      return [
        new Date(hw.assignedDate).toLocaleDateString(),
        hw.subject.name,
        hw.title,
        new Date(hw.dueDate).toLocaleDateString(),
        status,
        submission?.submissionDate ? new Date(submission.submissionDate).toLocaleDateString() : "Not submitted",
        submission?.grade !== null && submission?.grade !== undefined ? `${submission.grade}%` : "Not graded",
        `${hw.teacher.firstName} ${hw.teacher.lastName}`,
        submission?.feedback || "No feedback",
      ];
    }),

    [""], // Empty row
    
    // Subject performance
    ["SUBJECT PERFORMANCE"],
    ["Subject", "Total Homework", "Completed", "Completion Rate", "Average Grade"],
    
    ...getSubjectPerformanceForExport(homework),
    
    [""], // Empty row
    
    // Monthly performance
    ["MONTHLY PERFORMANCE"],
    ["Month", "Total Homework", "Completed", "Completion Rate"],
    
    ...getMonthlyPerformanceForExport(homework),
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
  response.headers.set("Content-Disposition", `attachment; filename="homework_report_${student.lastName}_${student.firstName}.csv"`);
  
  return response;
}

function generateStudentInsights(stats: any, homework: any[]) {
  const insights = [];

  // Performance insights
  if (stats.completionRate >= 95) {
    insights.push("🌟 <strong>Outstanding Performance!</strong> You're completing almost all your homework assignments. Keep up the excellent work!");
  } else if (stats.completionRate >= 85) {
    insights.push("👍 <strong>Great Job!</strong> You're doing well with homework completion. Aim for that perfect record!");
  } else if (stats.completionRate >= 70) {
    insights.push("📈 <strong>Good Progress!</strong> You're on the right track. Try to complete a few more assignments to boost your performance.");
  } else {
    insights.push("💪 <strong>Room for Improvement!</strong> Focus on completing more homework to enhance your learning and grades.");
  }

  // Punctuality insights
  if (stats.onTimeRate >= 90) {
    insights.push("⏰ <strong>Excellent Time Management!</strong> You consistently submit homework on time. This shows great responsibility!");
  } else if (stats.onTimeRate >= 70) {
    insights.push("🕐 <strong>Good Timing!</strong> Most of your submissions are on time. Try to start homework a bit earlier to avoid any rush.");
  } else {
    insights.push("📅 <strong>Time Management Tip:</strong> Consider creating a homework schedule to help submit assignments on time.");
  }

  // Grade insights
  if (stats.averageGrade >= 90) {
    insights.push("🏆 <strong>Academic Excellence!</strong> Your homework grades are outstanding. You're demonstrating mastery of the material!");
  } else if (stats.averageGrade >= 80) {
    insights.push("📚 <strong>Strong Performance!</strong> Your homework grades show good understanding. Keep up the quality work!");
  } else if (stats.averageGrade >= 70) {
    insights.push("📖 <strong>Steady Progress!</strong> Your grades show you're learning. Don't hesitate to ask teachers for help when needed.");
  } else if (stats.gradedCount > 0) {
    insights.push("🎯 <strong>Focus on Quality!</strong> Spend more time on each assignment to improve your understanding and grades.");
  }

  // Completion insights
  if (stats.totalHomework > 0) {
    const workload = stats.totalHomework;
    if (workload >= 50) {
      insights.push(`📊 <strong>Heavy Workload Managed!</strong> You've handled ${workload} assignments. That's impressive dedication!`);
    } else if (workload >= 20) {
      insights.push(`📝 <strong>Good Study Habits!</strong> You've completed ${workload} assignments, showing consistent effort.`);
    }
  }

  // Missed homework insights
  if (stats.missedCount > 0) {
    insights.push(`⚠️ <strong>Missing Assignments:</strong> You have ${stats.missedCount} missed homework. Try to catch up and establish a regular study routine.`);
  }

  // Pending homework insights
  if (stats.pendingCount > 0) {
    insights.push(`📋 <strong>Upcoming Work:</strong> You have ${stats.pendingCount} pending assignments. Plan your time to complete them on schedule.`);
  }

  return insights.map(insight => `<div style="margin-bottom: 10px;">${insight}</div>`).join("");
}

function getSubjectPerformanceForExport(homework: any[]) {
  const subjectPerformance: Record<string, any> = {};

  homework.forEach(hw => {
    const subjectName = hw.subject.name;
    const submission = hw.submissions[0];
    
    if (!subjectPerformance[subjectName]) {
      subjectPerformance[subjectName] = {
        total: 0,
        completed: 0,
        totalGrade: 0,
        gradedCount: 0,
      };
    }

    subjectPerformance[subjectName].total++;
    
    if (submission && (submission.status === "GRADED" || submission.status === "SUBMITTED")) {
      subjectPerformance[subjectName].completed++;
      
      if (submission.grade !== null && submission.grade !== undefined) {
        subjectPerformance[subjectName].totalGrade += submission.grade;
        subjectPerformance[subjectName].gradedCount++;
      }
    }
  });

  return Object.entries(subjectPerformance).map(([subject, perf]) => {
    const completionRate = perf.total > 0 ? Math.round((perf.completed / perf.total) * 100) : 0;
    const averageGrade = perf.gradedCount > 0 ? Math.round(perf.totalGrade / perf.gradedCount) : 0;
    
    return [
      subject,
      perf.total,
      perf.completed,
      `${completionRate}%`,
      perf.gradedCount > 0 ? `${averageGrade}%` : "No grades",
    ];
  });
}

function getMonthlyPerformanceForExport(homework: any[]) {
  const monthlyPerformance: Record<string, any> = {};

  homework.forEach(hw => {
    const monthKey = new Date(hw.assignedDate).toISOString().slice(0, 7); // YYYY-MM
    const submission = hw.submissions[0];
    
    if (!monthlyPerformance[monthKey]) {
      monthlyPerformance[monthKey] = {
        total: 0,
        completed: 0,
      };
    }

    monthlyPerformance[monthKey].total++;
    
    if (submission && (submission.status === "GRADED" || submission.status === "SUBMITTED")) {
      monthlyPerformance[monthKey].completed++;
    }
  });

  return Object.entries(monthlyPerformance)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, perf]) => {
      const monthName = new Date(month + "-01").toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long" 
      });
      const completionRate = perf.total > 0 ? Math.round((perf.completed / perf.total) * 100) : 0;
      
      return [
        monthName,
        perf.total,
        perf.completed,
        `${completionRate}%`,
      ];
    });
}