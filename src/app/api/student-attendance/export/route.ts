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
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const format = url.searchParams.get("format") || "pdf"; // pdf or excel
    const reportType = url.searchParams.get("reportType") || "detailed"; // detailed, summary
    
    // Verify student can only export their own data
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

    // Get student's branch for filtering
    const studentBranchId = student.branchId;

    // Build filter conditions
    const where: any = {
      studentId,
      branchId: studentBranchId, // Always filter by student's branch
    };

    if (academicYearId) where.academicYearId = parseInt(academicYearId);
    if (subjectId) where.subjectId = parseInt(subjectId);

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get attendance records
    const attendances = await prisma.attendance.findMany({
      where,
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
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        timetable: {
          select: {
            id: true,
            fullDate: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { subject: { name: "asc" } },
      ],
    });

    if (attendances.length === 0) {
      return NextResponse.json({ error: "No attendance data found for the specified filters" }, { status: 404 });
    }

    // Generate export based on format
    if (format === "pdf") {
      return generateStudentAttendancePDF({
        student,
        attendances,
        reportType,
        startDate,
        endDate,
        subjectId,
        academicYearId,
      });
    } else if (format === "excel") {
      return generateStudentAttendanceExcel({
        student,
        attendances,
        reportType,
        startDate,
        endDate,
        subjectId,
        academicYearId,
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (error) {
    console.error("Error exporting student attendance:", error);
    return NextResponse.json(
      { error: "Failed to export attendance data" },
      { status: 500 }
    );
  }
}

async function generateStudentAttendancePDF(data: any) {
  const { student, attendances, reportType, startDate, endDate, subjectId, academicYearId } = data;
  
  // Calculate summary statistics
  const totalRecords = attendances.length;
  const presentCount = attendances.filter((a: any) => a.status === "PRESENT").length;
  const absentCount = attendances.filter((a: any) => a.status === "ABSENT").length;
  const lateCount = attendances.filter((a: any) => a.status === "LATE").length;
  const excusedCount = attendances.filter((a: any) => a.status === "EXCUSED").length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  // Calculate subject-wise statistics
  const subjectStats: Record<string, any> = {};
  attendances.forEach((attendance: any) => {
    const subjectId = attendance.subjectId;
    const subjectName = attendance.subject.name;
    
    if (!subjectStats[subjectId]) {
      subjectStats[subjectId] = {
        subject: { id: subjectId, name: subjectName },
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: 0,
      };
    }

    subjectStats[subjectId].totalRecords++;
    if (attendance.status === "PRESENT") subjectStats[subjectId].presentCount++;
    if (attendance.status === "ABSENT") subjectStats[subjectId].absentCount++;
    if (attendance.status === "LATE") subjectStats[subjectId].lateCount++;
    if (attendance.status === "EXCUSED") subjectStats[subjectId].excusedCount++;
  });

  // Calculate rates for subjects
  Object.values(subjectStats).forEach((stats: any) => {
    stats.attendanceRate = stats.totalRecords > 0 ? 
      Math.round((stats.presentCount / stats.totalRecords) * 100) : 0;
  });

  // Group attendances by month for better organization
  const attendancesByMonth: Record<string, any[]> = {};
  attendances.forEach((attendance: any) => {
    const monthKey = new Date(attendance.date).toLocaleDateString("en-US", { year: "numeric", month: "long" });
    if (!attendancesByMonth[monthKey]) {
      attendancesByMonth[monthKey] = [];
    }
    attendancesByMonth[monthKey].push(attendance);
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Student Attendance Report - ${student.firstName} ${student.lastName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
        .student-info { background: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-section { background: white; padding: 15px; border-radius: 6px; border: 1px solid #93c5fd; }
        .info-label { font-weight: bold; color: #1e40af; margin-bottom: 5px; }
        .info-value { color: #374151; }
        .summary { background: #f0f9ff; padding: 25px; border-radius: 8px; margin-bottom: 30px; }
        .summary-title { font-size: 20px; font-weight: bold; color: #0c4a6e; margin-bottom: 20px; text-align: center; }
        .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; }
        .stat-card { text-align: center; background: white; padding: 20px; border-radius: 8px; border: 2px solid #e0f2fe; }
        .stat-number { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 14px; color: #64748b; }
        .present-stat { color: #059669; border-color: #a7f3d0; }
        .absent-stat { color: #dc2626; border-color: #fecaca; }
        .late-stat { color: #d97706; border-color: #fed7aa; }
        .excused-stat { color: #7c3aed; border-color: #ddd6fe; }
        .rate-stat { color: #0284c7; border-color: #bae6fd; }
        .subject-stats { background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 30px; }
        .section-header { background: #f8fafc; padding: 15px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; }
        .subject-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; gap: 15px; padding: 15px; border-bottom: 1px solid #f3f4f6; align-items: center; }
        .subject-row:last-child { border-bottom: none; }
        .subject-name { font-weight: 600; color: #374151; }
        .attendance-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .attendance-table th, .attendance-table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
        .attendance-table th { background: #3b82f6; color: white; font-weight: bold; }
        .attendance-table tr:nth-child(even) { background: #f9fafb; }
        .status-present { color: #059669; font-weight: bold; background: #d1fae5; padding: 4px 8px; border-radius: 4px; }
        .status-absent { color: #dc2626; font-weight: bold; background: #fee2e2; padding: 4px 8px; border-radius: 4px; }
        .status-late { color: #d97706; font-weight: bold; background: #fef3c7; padding: 4px 8px; border-radius: 4px; }
        .status-excused { color: #7c3aed; font-weight: bold; background: #ede9fe; padding: 4px 8px; border-radius: 4px; }
        .month-group { margin: 30px 0; }
        .month-header { background: #f3f4f6; padding: 12px; font-weight: bold; border-radius: 6px; margin-bottom: 15px; color: #374151; }
        .insights { background: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 30px 0; }
        .insights-title { font-weight: bold; color: #92400e; margin-bottom: 15px; font-size: 18px; }
        .insight-item { margin: 10px 0; padding: 10px; background: #fffbeb; border-radius: 4px; border-left: 4px solid #f59e0b; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; text-align: center; color: #6b7280; font-size: 12px; }
        .motivational { background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border-radius: 8px; padding: 20px; margin: 20px 0; }
        .badges { display: flex; gap: 10px; flex-wrap: wrap; margin: 15px 0; }
        .badge { background: #059669; color: white; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; }
        .badge-excellent { background: #7c3aed; }
        .badge-perfect { background: #dc2626; }
        .badge-punctual { background: #0284c7; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📚 Student Attendance Report</h1>
        <h2>${student.firstName} ${student.lastName} (${student.studentId})</h2>
        <p><strong>Class:</strong> ${student.class.name} | <strong>Branch:</strong> ${student.branch.shortName}</p>
        <p><strong>Academic Year:</strong> ${student.class.academicYear.name}</p>
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
          <div class="info-label">Student Information</div>
          <div class="info-value">
            <strong>Name:</strong> ${student.firstName} ${student.lastName}<br>
            <strong>Student ID:</strong> ${student.studentId}<br>
            <strong>Class:</strong> ${student.class.name}<br>
            <strong>Branch:</strong> ${student.branch.legalName}
          </div>
        </div>
        <div class="info-section">
          <div class="info-label">Report Details</div>
          <div class="info-value">
            <strong>Total Records:</strong> ${totalRecords}<br>
            <strong>Date Range:</strong> ${startDate && endDate ? 
              `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : 
              "All available data"}<br>
            <strong>Report Type:</strong> ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}<br>
            <strong>Generated By:</strong> Student Portal
          </div>
        </div>
      </div>

      <div class="summary">
        <div class="summary-title">📊 Attendance Summary</div>
        <div class="summary-grid">
          <div class="stat-card">
            <div class="stat-number">${totalRecords}</div>
            <div class="stat-label">Total Classes</div>
          </div>
          <div class="stat-card present-stat">
            <div class="stat-number">${presentCount}</div>
            <div class="stat-label">Present</div>
          </div>
          <div class="stat-card absent-stat">
            <div class="stat-number">${absentCount}</div>
            <div class="stat-label">Absent</div>
          </div>
          <div class="stat-card late-stat">
            <div class="stat-number">${lateCount}</div>
            <div class="stat-label">Late</div>
          </div>
          <div class="stat-card rate-stat">
            <div class="stat-number">${attendanceRate}%</div>
            <div class="stat-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      ${Object.values(subjectStats).length > 1 ? `
      <div class="subject-stats">
        <div class="section-header">📚 Subject-wise Attendance</div>
        <div class="subject-row" style="font-weight: bold; background: #f8fafc;">
          <div>Subject</div>
          <div>Total</div>
          <div>Present</div>
          <div>Absent</div>
          <div>Late</div>
          <div>Rate</div>
        </div>
        ${Object.values(subjectStats).map((stats: any) => `
          <div class="subject-row">
            <div class="subject-name">${stats.subject.name}</div>
            <div>${stats.totalRecords}</div>
            <div style="color: #059669;">${stats.presentCount}</div>
            <div style="color: #dc2626;">${stats.absentCount}</div>
            <div style="color: #d97706;">${stats.lateCount}</div>
            <div style="font-weight: bold; color: #0284c7;">${stats.attendanceRate}%</div>
          </div>
        `).join("")}
      </div>
      ` : ""}

      <div class="motivational">
        <h3 style="color: #0369a1; margin-bottom: 15px;">🏆 Your Achievements</h3>
        <div class="badges">
          ${attendanceRate === 100 ? '<span class="badge badge-perfect">🏆 Perfect Attendance</span>' : ""}
          ${attendanceRate >= 95 ? '<span class="badge badge-excellent">🌟 Excellent Attendance</span>' : ""}
          ${attendanceRate >= 85 ? '<span class="badge">✨ Good Attendance</span>' : ""}
          ${lateCount === 0 && totalRecords >= 10 ? '<span class="badge badge-punctual">⏰ Always On Time</span>' : ""}
        </div>
        <div style="margin-top: 15px; color: #0369a1; font-weight: 500;">
          ${attendanceRate >= 95 ? "🎉 Outstanding! Keep up the excellent work!" : 
            attendanceRate >= 85 ? "👍 Great job! You're doing well with your attendance." :
            attendanceRate >= 75 ? "📚 Good effort! Try to improve further." :
            "⚠️ Your attendance needs improvement. Aim for at least 85%."}
        </div>
      </div>

      ${reportType === "detailed" ? `
      <h3 style="color: #374151; margin: 30px 0 15px 0;">📋 Detailed Attendance Records</h3>
      
      ${Object.entries(attendancesByMonth).map(([month, monthAttendances]) => `
        <div class="month-group">
          <div class="month-header">📅 ${month} - ${monthAttendances.length} Record${monthAttendances.length !== 1 ? 's' : ''}</div>
          <table class="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Time</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${monthAttendances.map((attendance: any) => `
                <tr>
                  <td>${new Date(attendance.date).toLocaleDateString()}</td>
                  <td>${attendance.subject.name}</td>
                  <td>${attendance.teacher.firstName} ${attendance.teacher.lastName}</td>
                  <td>${new Date(attendance.timetable.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${new Date(attendance.timetable.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td><span class="status-${attendance.status.toLowerCase()}">${attendance.status}</span></td>
                  <td>${attendance.notes || "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `).join("")}
      ` : ""}

      <div class="insights">
        <div class="insights-title">💡 Insights & Recommendations</div>
        ${attendanceRate >= 95 ? 
          '<div class="insight-item">🌟 Excellent attendance! You\'re setting a great example for your peers.</div>' : ''}
        ${attendanceRate < 85 ? 
          '<div class="insight-item">📚 Focus on improving attendance. Regular attendance is crucial for academic success.</div>' : ''}
        ${lateCount > totalRecords * 0.1 ? 
          '<div class="insight-item">⏰ Work on punctuality. Being on time shows respect for your education and teachers.</div>' : ''}
        ${Object.values(subjectStats).some((s: any) => s.attendanceRate < 80) ? 
          '<div class="insight-item">📊 Some subjects have lower attendance. Identify what motivates you in your best-attended subjects.</div>' : ''}
        <div class="insight-item">📈 Keep tracking your attendance regularly to maintain or improve your performance.</div>
        <div class="insight-item">🎯 Aim for at least 85% attendance in all subjects for optimal academic success.</div>
      </div>

      <div class="footer">
        <p>This attendance report was generated for ${student.firstName} ${student.lastName} from ${student.branch.shortName}.</p>
        <p>For questions about attendance records, please contact your class teacher or school administration.</p>
        <p>Report covers${startDate && endDate ? ` the period from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : " all available attendance data"}.</p>
        <p style="margin-top: 15px; font-style: italic;">Remember: Regular attendance is the foundation of academic success! 📚✨</p>
      </div>
    </body>
    </html>
  `;

  const response = new NextResponse(htmlContent);
  response.headers.set("Content-Type", "text/html");
  response.headers.set("Content-Disposition", `attachment; filename="attendance_report_${student.lastName}_${reportType}.html"`);
  
  return response;
}

async function generateStudentAttendanceExcel(data: any) {
  const { student, attendances, reportType, startDate, endDate } = data;
  
  // Calculate summary statistics
  const totalRecords = attendances.length;
  const presentCount = attendances.filter((a: any) => a.status === "PRESENT").length;
  const absentCount = attendances.filter((a: any) => a.status === "ABSENT").length;
  const lateCount = attendances.filter((a: any) => a.status === "LATE").length;
  const excusedCount = attendances.filter((a: any) => a.status === "EXCUSED").length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  // Calculate subject-wise statistics
  const subjectStats: Record<string, any> = {};
  attendances.forEach((attendance: any) => {
    const subjectId = attendance.subjectId;
    const subjectName = attendance.subject.name;
    
    if (!subjectStats[subjectId]) {
      subjectStats[subjectId] = {
        subject: { name: subjectName },
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
      };
    }

    subjectStats[subjectId].totalRecords++;
    if (attendance.status === "PRESENT") subjectStats[subjectId].presentCount++;
    if (attendance.status === "ABSENT") subjectStats[subjectId].absentCount++;
    if (attendance.status === "LATE") subjectStats[subjectId].lateCount++;
  });

  Object.values(subjectStats).forEach((stats: any) => {
    stats.attendanceRate = stats.totalRecords > 0 ? 
      Math.round((stats.presentCount / stats.totalRecords) * 100) : 0;
  });

  // Generate CSV content (Excel-compatible)
  const csvRows = [
    // Header information
    [`Student Attendance Report - ${student.firstName} ${student.lastName}`],
    [`Student ID: ${student.studentId}`],
    [`Class: ${student.class.name}`],
    [`Branch: ${student.branch.shortName} - ${student.branch.legalName}`],
    [`Academic Year: ${student.class.academicYear.name}`],
    [`Period: ${startDate ? new Date(startDate).toLocaleDateString() : "All"} - ${endDate ? new Date(endDate).toLocaleDateString() : "All"}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [""], // Empty row
    
    // Summary section
    ["ATTENDANCE SUMMARY"],
    ["Metric", "Count", "Percentage"],
    ["Total Records", totalRecords, ""],
    ["Present", presentCount, `${Math.round((presentCount / totalRecords) * 100)}%`],
    ["Absent", absentCount, `${Math.round((absentCount / totalRecords) * 100)}%`],
    ["Late", lateCount, `${Math.round((lateCount / totalRecords) * 100)}%`],
    ["Excused", excusedCount, `${Math.round((excusedCount / totalRecords) * 100)}%`],
    ["Overall Attendance Rate", "", `${attendanceRate}%`],
    [""], // Empty row

    // Subject-wise statistics
    ...(Object.values(subjectStats).length > 1 ? [
      ["SUBJECT-WISE ATTENDANCE"],
      ["Subject", "Total Records", "Present", "Absent", "Late", "Attendance Rate"],
      ...Object.values(subjectStats).map((stats: any) => [
        stats.subject.name,
        stats.totalRecords,
        stats.presentCount,
        stats.absentCount,
        stats.lateCount,
        `${stats.attendanceRate}%`,
      ]),
      [""], // Empty row
    ] : []),
    
    // Detailed records
    ["DETAILED ATTENDANCE RECORDS"],
    ["Date", "Subject", "Teacher", "Start Time", "End Time", "Status", "Notes"],
    
    // Attendance data
    ...attendances.map((attendance: any) => [
      new Date(attendance.date).toLocaleDateString(),
      attendance.subject.name,
      `${attendance.teacher.firstName} ${attendance.teacher.lastName}`,
      new Date(attendance.timetable.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      new Date(attendance.timetable.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      attendance.status,
      attendance.notes || "",
    ]),

    [""], // Empty row
    
    // Insights
    ["INSIGHTS & RECOMMENDATIONS"],
    ["Insight"],
    [attendanceRate >= 95 ? "Excellent attendance! Keep up the great work!" : 
     attendanceRate >= 85 ? "Good attendance! Continue this positive trend." :
     attendanceRate >= 75 ? "Attendance needs improvement. Aim for 85% or higher." :
     "Critical: Attendance is below acceptable levels. Please improve immediately."],
    
    ...(lateCount > totalRecords * 0.1 ? [["Work on punctuality to improve overall performance."]] : []),
    ...(Object.values(subjectStats).some((s: any) => s.attendanceRate < 80) ? [["Focus on subjects with lower attendance rates."]] : []),
    ["Regular attendance is crucial for academic success."],
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
  response.headers.set("Content-Disposition", `attachment; filename="attendance_report_${student.lastName}_${reportType}.csv"`);
  
  return response;
}
