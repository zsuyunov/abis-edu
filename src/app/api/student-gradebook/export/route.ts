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
    const studentId = url.searchParams.get("studentId") || session.id;
    const academicYearId = url.searchParams.get("academicYearId");
    const subjectId = url.searchParams.get("subjectId");
    const gradeType = url.searchParams.get("gradeType");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const format = url.searchParams.get("format") || "pdf"; // pdf or excel
    const timeFilter = url.searchParams.get("timeFilter") || "current";
    
    // Verify student can only access their own data
    if (session.id !== studentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get student information
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            academicYear: true,
            branch: true,
          },
        },
        branch: true,
        parent: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
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
                some: { id: studentId },
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
                some: { id: studentId },
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
      targetAcademicYearId = availableAcademicYears[0]?.id || student.class.academicYearId;
    } else {
      targetAcademicYearId = availableAcademicYears[0]?.id;
    }

    if (!targetAcademicYearId) {
      return NextResponse.json({ error: "No academic year data available" }, { status: 404 });
    }

    // Build filter conditions for grades
    const gradeWhere: any = {
      studentId,
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
      studentId,
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
      return generateStudentPDF({
        student,
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
      return generateStudentExcel({
        student,
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
    console.error("Error exporting student gradebook:", error);
    return NextResponse.json(
      { error: "Failed to export gradebook" },
      { status: 500 }
    );
  }
}

async function generateStudentPDF(data: any) {
  const { student, grades, examResults, academicYear, timeFilter, startDate, endDate } = data;
  
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
  };

  // Simple HTML structure for PDF generation
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${student.firstName} ${student.lastName} - Academic Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; }
        .info-label { font-weight: bold; color: #374151; }
        .info-value { color: #6b7280; margin-top: 5px; }
        .summary { background: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-title { font-size: 18px; font-weight: bold; color: #1e40af; margin-bottom: 15px; }
        .summary-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .stat-box { text-align: center; background: white; padding: 15px; border-radius: 6px; border: 1px solid #93c5fd; }
        .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .grades-table, .exams-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .grades-table th, .grades-table td, .exams-table th, .exams-table td { 
          border: 1px solid #d1d5db; padding: 12px; text-align: left; 
        }
        .grades-table th, .exams-table th { background: #2563eb; color: white; font-weight: bold; }
        .grades-table tr:nth-child(even), .exams-table tr:nth-child(even) { background: #f9fafb; }
        .pass { color: #059669; font-weight: bold; }
        .fail { color: #dc2626; font-weight: bold; }
        .grade-excellent { background: #d1fae5; color: #065f46; }
        .grade-good { background: #dbeafe; color: #1e40af; }
        .grade-fair { background: #fef3c7; color: #92400e; }
        .grade-weak { background: #fee2e2; color: #991b1b; }
        .section-title { font-size: 18px; font-weight: bold; color: #374151; margin: 30px 0 15px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${student.firstName} ${student.lastName}'s Academic Report</h1>
        <p>Student ID: ${student.studentId} | Class: ${student.class.name}</p>
        <p>${timeFilter === "current" ? "Current" : "Archived"} Academic Year: ${academicYear?.name || "N/A"}</p>
        ${startDate && endDate ? `<p>Report Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>` : ""}
      </div>

      <div class="student-info">
        <div class="info-box">
          <div class="info-label">Student Information</div>
          <div class="info-value">
            Name: ${student.firstName} ${student.lastName}<br>
            Student ID: ${student.studentId}<br>
            Class: ${student.class.name}<br>
            Branch: ${student.branch.name}
          </div>
        </div>
        <div class="info-box">
          <div class="info-label">Academic Information</div>
          <div class="info-value">
            Academic Year: ${academicYear?.name || "N/A"}<br>
            ${academicYear ? `Period: ${new Date(academicYear.startDate).toLocaleDateString()} - ${new Date(academicYear.endDate).toLocaleDateString()}` : ""}<br>
            Status: ${timeFilter === "current" ? "Active" : "Archived"}
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
      </div>

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

      <div class="footer">
        <p>This academic report was generated for ${student.firstName} ${student.lastName}.</p>
        <p>Generated on ${new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "long", 
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}</p>
        <p>For questions about grades or exams, please contact the respective subject teachers.</p>
      </div>
    </body>
    </html>
  `;

  const response = new NextResponse(htmlContent);
  response.headers.set("Content-Type", "text/html");
  response.headers.set("Content-Disposition", `attachment; filename="${student.firstName}_${student.lastName}_academic_report.html"`);
  
  return response;
}

async function generateStudentExcel(data: any) {
  const { student, grades, examResults, academicYear, timeFilter, startDate, endDate } = data;
  
  // Generate CSV content (Excel-compatible)
  const csvRows = [
    // Header information
    [`${student.firstName} ${student.lastName}'s Academic Report`],
    [`Student ID: ${student.studentId}`],
    [`Class: ${student.class.name}`],
    [`Academic Year: ${academicYear?.name || "N/A"}`],
    [`Period: ${startDate ? new Date(startDate).toLocaleDateString() : "All"} - ${endDate ? new Date(endDate).toLocaleDateString() : "All"}`],
    [`Generated: ${new Date().toLocaleString()}`],
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
    
    // Summary section
    ["SUMMARY STATISTICS"],
    ["Total Grades", grades.length],
    ["Total Exams", examResults.length],
    ["Average Grade", grades.length > 0 ? Math.round((grades.reduce((sum: number, g: any) => sum + g.value, 0) / grades.length) * 100) / 100 : 0],
    ["Exam Pass Rate", examResults.length > 0 ? `${Math.round((examResults.filter((r: any) => r.status === "PASS").length / examResults.length) * 100)}%` : "0%"],
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
  response.headers.set("Content-Disposition", `attachment; filename="${student.firstName}_${student.lastName}_academic_report.csv"`);
  
  return response;
}
