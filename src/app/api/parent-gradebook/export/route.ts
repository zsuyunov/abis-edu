import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const parentId = url.searchParams.get("parentId") || session.id;
    const childId = url.searchParams.get("childId");
    const academicYearId = url.searchParams.get("academicYearId");
    const subjectId = url.searchParams.get("subjectId");
    const gradeType = url.searchParams.get("gradeType");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const format = url.searchParams.get("format") || "pdf"; // pdf or excel
    const timeFilter = url.searchParams.get("timeFilter") || "current";
    
    // Verify parent can only access their own data
    if (session.id !== parentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get parent and child information
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        students: {
          include: {
            class: {
              include: {
                academicYear: true,
                branch: true,
              },
            },
            branch: true,
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Determine target child
    let targetChild;
    if (childId) {
      targetChild = parent.students.find(child => child.id === childId);
    } else {
      targetChild = parent.students[0];
    }

    if (!targetChild) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Get academic years
    let availableAcademicYears;
    if (timeFilter === "current") {
      availableAcademicYears = await prisma.academicYear.findMany({
        where: { 
          isCurrent: true, 
          status: "ACTIVE",
          classes: {
            some: {
              students: {
                some: { 
                  parentId: parentId 
                },
              },
            },
          },
        },
        orderBy: { startDate: "desc" },
      });
    } else {
      availableAcademicYears = await prisma.academicYear.findMany({
        where: { 
          isCurrent: false,
          classes: {
            some: {
              students: {
                some: { 
                  parentId: parentId 
                },
              },
            },
          },
        },
        orderBy: { startDate: "desc" },
      });
    }

    // Determine academic year
    let targetAcademicYearId;
    if (academicYearId) {
      targetAcademicYearId = parseInt(academicYearId);
    } else if (timeFilter === "current") {
      targetAcademicYearId = availableAcademicYears[0]?.id || targetChild.class.academicYearId;
    } else {
      targetAcademicYearId = availableAcademicYears[0]?.id;
    }

    if (!targetAcademicYearId) {
      return NextResponse.json({ error: "No academic year data available" }, { status: 404 });
    }

    // Build filter conditions for grades
    const gradeWhere: any = {
      studentId: targetChild.id,
      academicYearId: targetAcademicYearId,
      status: "ACTIVE",
    };

    if (subjectId) gradeWhere.subjectId = parseInt(subjectId);
    if (gradeType) gradeWhere.type = gradeType;
    if (startDate && endDate) {
      gradeWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get grades
    const grades = await prisma.grade.findMany({
      where: gradeWhere,
      include: {
        subject: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        class: true,
        academicYear: true,
      },
      orderBy: [
        { date: "desc" },
        { subject: { name: "asc" } },
      ],
    });

    // Build filter conditions for exam results
    const examWhere: any = {
      studentId: targetChild.id,
      exam: {
        academicYearId: targetAcademicYearId,
        status: "ACTIVE",
      },
    };

    if (subjectId) {
      examWhere.exam.subjectId = parseInt(subjectId);
    }

    if (startDate && endDate) {
      examWhere.exam.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get exam results
    const examResults = await prisma.examResult.findMany({
      where: examWhere,
      include: {
        exam: {
          include: {
            subject: true,
            teacher: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            class: true,
            academicYear: true,
          },
        },
      },
      orderBy: [
        { exam: { date: "desc" } },
        { exam: { subject: { name: "asc" } } },
      ],
    });

    const currentAcademicYear = availableAcademicYears.find(ay => ay.id === targetAcademicYearId);

    // Generate export content based on format
    if (format === "pdf") {
      return generateParentPDF({
        parent,
        child: targetChild,
        grades,
        examResults,
        academicYear: currentAcademicYear,
        timeFilter,
        startDate,
        endDate,
        gradeType,
        subjectId,
      });
    } else if (format === "excel") {
      return generateParentExcel({
        parent,
        child: targetChild,
        grades,
        examResults,
        academicYear: currentAcademicYear,
        timeFilter,
        startDate,
        endDate,
        gradeType,
        subjectId,
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (error) {
    console.error("Error exporting parent gradebook:", error);
    return NextResponse.json(
      { error: "Failed to export gradebook" },
      { status: 500 }
    );
  }
}

async function generateParentPDF(data: any) {
  const { parent, child, grades, examResults, academicYear, timeFilter, startDate, endDate } = data;
  
  // Calculate summary statistics
  const gradeValues = grades.map((g: any) => g.value);
  const examMarks = examResults.map((r: any) => (r.marksObtained / r.exam.totalMarks) * 100);
  const allScores = [...gradeValues, ...examMarks];
  
  const summary = {
    totalGrades: grades.length,
    totalExams: examResults.length,
    averageGrade: gradeValues.length > 0 ? 
      Math.round((gradeValues.reduce((sum: number, v: number) => sum + v, 0) / gradeValues.length) * 100) / 100 : 0,
    averageExamScore: examMarks.length > 0 ? 
      Math.round((examMarks.reduce((sum: number, v: number) => sum + v, 0) / examMarks.length) * 100) / 100 : 0,
    overallAverage: allScores.length > 0 ? 
      Math.round((allScores.reduce((sum: number, v: number) => sum + v, 0) / allScores.length) * 100) / 100 : 0,
    highestScore: allScores.length > 0 ? Math.max(...allScores) : 0,
    lowestScore: allScores.length > 0 ? Math.min(...allScores) : 0,
    examPassRate: examResults.length > 0 ? 
      Math.round((examResults.filter((r: any) => r.status === "PASS").length / examResults.length) * 100) : 0,
    failedExams: examResults.filter((r: any) => r.status === "FAIL"),
  };

  // Simple HTML structure for PDF generation
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${child.firstName} ${child.lastName} - Parent Academic Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 20px; }
        .parent-info { background: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; }
        .info-label { font-weight: bold; color: #374151; }
        .info-value { color: #6b7280; margin-top: 5px; }
        .summary { background: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-title { font-size: 18px; font-weight: bold; color: #0277bd; margin-bottom: 15px; }
        .summary-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .stat-box { text-align: center; background: white; padding: 15px; border-radius: 6px; border: 1px solid #81d4fa; }
        .stat-number { font-size: 24px; font-weight: bold; color: #0277bd; }
        .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .alert-section { background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin-bottom: 20px; }
        .alert-title { font-weight: bold; color: #e65100; margin-bottom: 10px; }
        .failed-exam { background: #ffebee; border: 1px solid #f44336; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .grades-table, .exams-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .grades-table th, .grades-table td, .exams-table th, .exams-table td { 
          border: 1px solid #d1d5db; padding: 12px; text-align: left; 
        }
        .grades-table th, .exams-table th { background: #1e40af; color: white; font-weight: bold; }
        .grades-table tr:nth-child(even), .exams-table tr:nth-child(even) { background: #f9fafb; }
        .pass { color: #2e7d32; font-weight: bold; }
        .fail { color: #d32f2f; font-weight: bold; background: #ffebee; }
        .grade-excellent { background: #e8f5e9; color: #2e7d32; }
        .grade-good { background: #e3f2fd; color: #1565c0; }
        .grade-fair { background: #fff8e1; color: #ef6c00; }
        .grade-weak { background: #ffebee; color: #c62828; }
        .section-title { font-size: 18px; font-weight: bold; color: #374151; margin: 30px 0 15px 0; }
        .parent-guidance { background: #f0f4ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin-top: 30px; }
        .guidance-title { font-weight: bold; color: #1e40af; margin-bottom: 10px; }
        .guidance-item { margin: 8px 0; padding-left: 20px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${child.firstName} ${child.lastName}'s Academic Report</h1>
        <h2>Parent Report for ${parent.firstName} ${parent.lastName}</h2>
        <p>${timeFilter === "current" ? "Current" : "Archived"} Academic Year: ${academicYear?.name || "N/A"}</p>
        ${startDate && endDate ? `<p>Report Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>` : ""}
      </div>

      <div class="parent-info">
        <div class="info-label">Parent Information</div>
        <div class="info-value">
          Parent Name: ${parent.firstName} ${parent.lastName}<br>
          Report Generated: ${new Date().toLocaleDateString("en-US", { 
            year: "numeric", 
            month: "long", 
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}<br>
          Report Type: ${timeFilter === "current" ? "Current Academic Performance" : "Historical Academic Records"}
        </div>
      </div>

      <div class="student-info">
        <div class="info-box">
          <div class="info-label">Student Information</div>
          <div class="info-value">
            Name: ${child.firstName} ${child.lastName}<br>
            Student ID: ${child.studentId}<br>
            Class: ${child.class.name}<br>
            Branch: ${child.branch.name}
          </div>
        </div>
        <div class="info-box">
          <div class="info-label">Academic Information</div>
          <div class="info-value">
            Academic Year: ${academicYear?.name || "N/A"}<br>
            ${academicYear ? `Period: ${new Date(academicYear.startDate).toLocaleDateString()} - ${new Date(academicYear.endDate).toLocaleDateString()}` : ""}<br>
            Status: ${timeFilter === "current" ? "Active Student" : "Historical Records"}
          </div>
        </div>
      </div>

      <div class="summary">
        <div class="summary-title">Academic Performance Summary</div>
        <div class="summary-stats">
          <div class="stat-box">
            <div class="stat-number">${summary.totalGrades}</div>
            <div class="stat-label">Total Grades</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${summary.totalExams}</div>
            <div class="stat-label">Total Exams</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${summary.overallAverage}%</div>
            <div class="stat-label">Overall Average</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${summary.examPassRate}%</div>
            <div class="stat-label">Exam Pass Rate</div>
          </div>
        </div>
        
        <div style="margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: #388e3c;">Highest Score: ${summary.highestScore}%</div>
            <div style="font-size: 12px; color: #6b7280;">Best achievement</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: ${summary.lowestScore < 50 ? '#d32f2f' : '#6b7280'};">Lowest Score: ${summary.lowestScore}%</div>
            <div style="font-size: 12px; color: #6b7280;">Area for improvement</div>
          </div>
        </div>
      </div>

      ${summary.failedExams.length > 0 ? `
        <div class="alert-section">
          <div class="alert-title">⚠️ Failed Exams Requiring Attention</div>
          <p>Your child has ${summary.failedExams.length} failed exam${summary.failedExams.length > 1 ? 's' : ''} that may require additional support:</p>
          ${summary.failedExams.map((exam: any) => `
            <div class="failed-exam">
              <strong>${exam.exam.subject.name}</strong> - ${exam.exam.title}<br>
              Score: ${exam.marksObtained}/${exam.exam.totalMarks} (${Math.round((exam.marksObtained / exam.exam.totalMarks) * 100)}%)<br>
              Date: ${new Date(exam.exam.date).toLocaleDateString()}<br>
              ${exam.feedback ? `Teacher Feedback: ${exam.feedback}` : ''}
            </div>
          `).join("")}
          <p style="margin-top: 15px; font-style: italic;">💡 Consider discussing these results with the subject teachers for improvement strategies.</p>
        </div>
      ` : ''}

      <div class="section-title">Grade Records</div>
      <table class="grades-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Subject</th>
            <th>Type</th>
            <th>Grade</th>
            <th>Max</th>
            <th>Percentage</th>
            <th>Teacher</th>
            <th>Comments</th>
          </tr>
        </thead>
        <tbody>
          ${grades.map((grade: any) => {
            const percentage = Math.round((grade.value / grade.maxValue) * 100);
            let gradeClass = "grade-weak";
            if (percentage >= 90) gradeClass = "grade-excellent";
            else if (percentage >= 70) gradeClass = "grade-good";
            else if (percentage >= 50) gradeClass = "grade-fair";
            
            return `
              <tr>
                <td>${new Date(grade.date).toLocaleDateString()}</td>
                <td>${grade.subject.name}</td>
                <td>${grade.type}</td>
                <td class="${gradeClass}">${grade.value}</td>
                <td>${grade.maxValue}</td>
                <td class="${gradeClass}">${percentage}%</td>
                <td>${grade.teacher.firstName} ${grade.teacher.lastName}</td>
                <td>${grade.description || "-"}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>

      <div class="section-title">Exam Results</div>
      <table class="exams-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Exam</th>
            <th>Subject</th>
            <th>Marks Obtained</th>
            <th>Total Marks</th>
            <th>Passing Mark</th>
            <th>Percentage</th>
            <th>Result</th>
            <th>Teacher Feedback</th>
          </tr>
        </thead>
        <tbody>
          ${examResults.map((result: any) => {
            const percentage = Math.round((result.marksObtained / result.exam.totalMarks) * 100);
            return `
              <tr>
                <td>${new Date(result.exam.date).toLocaleDateString()}</td>
                <td>${result.exam.title}</td>
                <td>${result.exam.subject.name}</td>
                <td>${result.marksObtained}</td>
                <td>${result.exam.totalMarks}</td>
                <td>${result.exam.passingMark}</td>
                <td>${percentage}%</td>
                <td class="${result.status === "PASS" ? "pass" : "fail"}">${result.status}</td>
                <td>${result.feedback || "-"}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>

      <div class="parent-guidance">
        <div class="guidance-title">📋 Parent Guidance & Recommendations</div>
        ${summary.overallAverage >= 85 ? `
          <div class="guidance-item">🌟 <strong>Excellent Performance:</strong> ${child.firstName} is performing exceptionally well. Continue to encourage and support their academic efforts.</div>
        ` : summary.overallAverage >= 70 ? `
          <div class="guidance-item">👍 <strong>Good Performance:</strong> ${child.firstName} is doing well academically. Encourage continued effort and help maintain this positive momentum.</div>
        ` : summary.overallAverage >= 50 ? `
          <div class="guidance-item">📚 <strong>Room for Improvement:</strong> ${child.firstName} would benefit from additional study support. Consider setting up a regular study schedule and reviewing challenging topics together.</div>
        ` : `
          <div class="guidance-item">⚠️ <strong>Requires Immediate Attention:</strong> ${child.firstName} needs significant academic support. Please schedule meetings with teachers to develop an improvement plan.</div>
        `}
        
        <div class="guidance-item">💬 <strong>Communication:</strong> Regularly discuss ${child.firstName}'s academic progress and any challenges they may be facing.</div>
        <div class="guidance-item">🏠 <strong>Home Support:</strong> Create a conducive study environment and establish consistent homework routines.</div>
        <div class="guidance-item">🤝 <strong>Teacher Collaboration:</strong> Maintain open communication with teachers to stay informed about classroom performance and behavior.</div>
        
        ${summary.failedExams.length > 0 ? `
          <div class="guidance-item">📝 <strong>Exam Preparation:</strong> Focus on improving exam preparation strategies. Consider additional tutoring for subjects with failed exams.</div>
        ` : ''}
        
        <div class="guidance-item">📈 <strong>Progress Tracking:</strong> Monitor ${child.firstName}'s academic progress regularly using this report and parent portal updates.</div>
      </div>

      <div class="footer">
        <p>This academic report was generated for ${parent.firstName} ${parent.lastName} regarding ${child.firstName} ${child.lastName}'s academic performance.</p>
        <p>For questions about specific grades or exams, please contact the respective subject teachers.</p>
        <p>Next parent-teacher conferences: Please check the school calendar for upcoming meeting schedules.</p>
      </div>
    </body>
    </html>
  `;

  const response = new NextResponse(htmlContent);
  response.headers.set("Content-Type", "text/html");
  response.headers.set("Content-Disposition", `attachment; filename="${child.firstName}_${child.lastName}_parent_report.html"`);
  
  return response;
}

async function generateParentExcel(data: any) {
  const { parent, child, grades, examResults, academicYear, timeFilter, startDate, endDate } = data;
  
  // Generate CSV content (Excel-compatible)
  const csvRows = [
    // Header information
    [`${child.firstName} ${child.lastName}'s Academic Report - Parent View`],
    [`Parent: ${parent.firstName} ${parent.lastName}`],
    [`Student ID: ${child.studentId}`],
    [`Class: ${child.class.name}`],
    [`Academic Year: ${academicYear?.name || "N/A"}`],
    [`Period: ${startDate ? new Date(startDate).toLocaleDateString() : "All"} - ${endDate ? new Date(endDate).toLocaleDateString() : "All"}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [""], // Empty row
    
    // Summary section
    ["ACADEMIC PERFORMANCE SUMMARY"],
    ["Metric", "Value"],
    ["Total Grades", grades.length],
    ["Total Exams", examResults.length],
    ["Overall Average", grades.length > 0 ? Math.round((grades.reduce((sum: number, g: any) => sum + g.value, 0) / grades.length) * 100) / 100 + "%" : "0%"],
    ["Exam Pass Rate", examResults.length > 0 ? Math.round((examResults.filter((r: any) => r.status === "PASS").length / examResults.length) * 100) + "%" : "0%"],
    ["Highest Score", grades.length > 0 ? Math.max(...grades.map((g: any) => g.value)) + "%" : "0%"],
    ["Lowest Score", grades.length > 0 ? Math.min(...grades.map((g: any) => g.value)) + "%" : "0%"],
    [""], // Empty row
    
    // Grades section
    ["GRADE RECORDS"],
    ["Date", "Subject", "Type", "Grade", "Max Grade", "Percentage", "Teacher", "Comments"],
    
    // Grades data
    ...grades.map((grade: any) => [
      new Date(grade.date).toLocaleDateString(),
      grade.subject.name,
      grade.type,
      grade.value,
      grade.maxValue,
      `${Math.round((grade.value / grade.maxValue) * 100)}%`,
      `${grade.teacher.firstName} ${grade.teacher.lastName}`,
      grade.description || "",
    ]),
    
    [""], // Empty row
    
    // Exams section
    ["EXAM RESULTS"],
    ["Date", "Exam", "Subject", "Marks Obtained", "Total Marks", "Passing Mark", "Percentage", "Result", "Teacher Feedback"],
    
    // Exam results data
    ...examResults.map((result: any) => [
      new Date(result.exam.date).toLocaleDateString(),
      result.exam.title,
      result.exam.subject.name,
      result.marksObtained,
      result.exam.totalMarks,
      result.exam.passingMark,
      `${Math.round((result.marksObtained / result.exam.totalMarks) * 100)}%`,
      result.status,
      result.feedback || "",
    ]),
    
    [""], // Empty row
    
    // Failed exams section (if any)
    ...(examResults.filter((r: any) => r.status === "FAIL").length > 0 ? [
      ["FAILED EXAMS REQUIRING ATTENTION"],
      ["Subject", "Exam", "Score", "Total", "Percentage", "Date", "Feedback"],
      ...examResults.filter((r: any) => r.status === "FAIL").map((result: any) => [
        result.exam.subject.name,
        result.exam.title,
        result.marksObtained,
        result.exam.totalMarks,
        `${Math.round((result.marksObtained / result.exam.totalMarks) * 100)}%`,
        new Date(result.exam.date).toLocaleDateString(),
        result.feedback || "",
      ]),
      [""], // Empty row
    ] : []),
    
    // Parent guidance section
    ["PARENT GUIDANCE"],
    ["Recommendation Type", "Guidance"],
    ["Overall Performance", grades.length > 0 && Math.round((grades.reduce((sum: number, g: any) => sum + g.value, 0) / grades.length) * 100) / 100 >= 85 ? "Excellent - Continue encouraging" : "Consider additional support"],
    ["Study Support", "Create regular study schedule and review challenging topics"],
    ["Teacher Communication", "Maintain regular contact with subject teachers"],
    ["Home Environment", "Ensure conducive study environment"],
    ["Progress Monitoring", "Track academic progress regularly"],
  ];

  // Convert to CSV format
  const csvContent = csvRows
    .map(row => 
      row.map(cell => 
        typeof cell === "string" && (cell.includes(",") || cell.includes('"')) 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(",")
    )
    .join("\n");

  const response = new NextResponse(csvContent);
  response.headers.set("Content-Type", "text/csv");
  response.headers.set("Content-Disposition", `attachment; filename="${child.firstName}_${child.lastName}_parent_report.csv"`);
  
  return response;
}
