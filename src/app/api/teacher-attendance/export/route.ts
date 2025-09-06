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
    const teacherId = url.searchParams.get("teacherId") || session.id;
    const branchId = url.searchParams.get("branchId");
    const academicYearId = url.searchParams.get("academicYearId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const format = url.searchParams.get("format") || "pdf"; // pdf or excel
    const reportType = url.searchParams.get("reportType") || "daily"; // daily, weekly, monthly, termly
    
    // Verify teacher can only export their own data
    if (session.id !== teacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get teacher information
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        branch: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Ensure teacher can only export data from their assigned branch
    const teacherBranchId = teacher.branchId;
    
    if (branchId && parseInt(branchId) !== teacherBranchId) {
      return NextResponse.json({ error: "Access denied to this branch" }, { status: 403 });
    }

    // Build filter conditions
    const where: any = {
      teacherId,
      branchId: teacherBranchId,
    };

    if (academicYearId) where.academicYearId = parseInt(academicYearId);
    if (classId) where.classId = parseInt(classId);
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
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
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
        { student: { firstName: "asc" } },
      ],
    });

    if (attendances.length === 0) {
      return NextResponse.json({ error: "No attendance data found for the specified filters" }, { status: 404 });
    }

    // Generate export based on format
    if (format === "pdf") {
      return generateAttendancePDF({
        teacher,
        attendances,
        reportType,
        startDate,
        endDate,
        classId,
        subjectId,
        academicYearId,
      });
    } else if (format === "excel") {
      return generateAttendanceExcel({
        teacher,
        attendances,
        reportType,
        startDate,
        endDate,
        classId,
        subjectId,
        academicYearId,
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (error) {
    console.error("Error exporting attendance:", error);
    return NextResponse.json(
      { error: "Failed to export attendance data" },
      { status: 500 }
    );
  }
}

async function generateAttendancePDF(data: any) {
  const { teacher, attendances, reportType, startDate, endDate, classId, subjectId, academicYearId } = data;
  
  // Calculate summary statistics
  const totalRecords = attendances.length;
  const presentCount = attendances.filter((a: any) => a.status === "PRESENT").length;
  const absentCount = attendances.filter((a: any) => a.status === "ABSENT").length;
  const lateCount = attendances.filter((a: any) => a.status === "LATE").length;
  const excusedCount = attendances.filter((a: any) => a.status === "EXCUSED").length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  // Group attendances by date for better organization
  const attendancesByDate: Record<string, any[]> = {};
  attendances.forEach((attendance: any) => {
    const dateKey = new Date(attendance.date).toLocaleDateString();
    if (!attendancesByDate[dateKey]) {
      attendancesByDate[dateKey] = [];
    }
    attendancesByDate[dateKey].push(attendance);
  });

  // Get unique students and classes
  const uniqueStudents = [...new Map(attendances.map((a: any) => [a.student.id, a.student])).values()];
  const uniqueClasses = [...new Map(attendances.map((a: any) => [a.class.id, a.class])).values()];
  const uniqueSubjects = [...new Map(attendances.map((a: any) => [a.subject.id, a.subject])).values()];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Attendance Report - ${teacher.firstName} ${teacher.lastName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .teacher-info { background: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .report-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; }
        .info-label { font-weight: bold; color: #374151; }
        .info-value { color: #6b7280; margin-top: 5px; }
        .summary { background: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-title { font-size: 18px; font-weight: bold; color: #0277bd; margin-bottom: 15px; }
        .summary-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; }
        .stat-box { text-align: center; background: white; padding: 15px; border-radius: 6px; border: 1px solid #81d4fa; }
        .stat-number { font-size: 24px; font-weight: bold; color: #0277bd; }
        .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .attendance-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .attendance-table th, .attendance-table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
        .attendance-table th { background: #2563eb; color: white; font-weight: bold; }
        .attendance-table tr:nth-child(even) { background: #f9fafb; }
        .status-present { color: #059669; font-weight: bold; background: #d1fae5; padding: 4px 8px; border-radius: 4px; }
        .status-absent { color: #dc2626; font-weight: bold; background: #fee2e2; padding: 4px 8px; border-radius: 4px; }
        .status-late { color: #d97706; font-weight: bold; background: #fef3c7; padding: 4px 8px; border-radius: 4px; }
        .status-excused { color: #7c3aed; font-weight: bold; background: #ede9fe; padding: 4px 8px; border-radius: 4px; }
        .date-group { margin: 30px 0; }
        .date-header { background: #f3f4f6; padding: 10px; font-weight: bold; border-radius: 4px; margin-bottom: 10px; }
        .section-title { font-size: 18px; font-weight: bold; color: #374151; margin: 30px 0 15px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Attendance Report</h1>
        <h2>Teacher: ${teacher.firstName} ${teacher.lastName}</h2>
        <p>Branch: ${teacher.branch.shortName} - ${teacher.branch.legalName}</p>
        <p>Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}</p>
        ${startDate && endDate ? `<p>Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>` : ""}
      </div>

      <div class="teacher-info">
        <div class="info-label">Report Information</div>
        <div class="info-value">
          Generated: ${new Date().toLocaleDateString("en-US", { 
            year: "numeric", 
            month: "long", 
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}<br>
          Total Records: ${totalRecords}<br>
          Classes Covered: ${uniqueClasses.map(c => c.name).join(", ")}<br>
          Subjects Covered: ${uniqueSubjects.map(s => s.name).join(", ")}
        </div>
      </div>

      <div class="summary">
        <div class="summary-title">Attendance Summary</div>
        <div class="summary-stats">
          <div class="stat-box">
            <div class="stat-number">${totalRecords}</div>
            <div class="stat-label">Total Records</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${presentCount}</div>
            <div class="stat-label">Present</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${absentCount}</div>
            <div class="stat-label">Absent</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${lateCount}</div>
            <div class="stat-label">Late</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${attendanceRate}%</div>
            <div class="stat-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      <div class="section-title">Detailed Attendance Records</div>
      
      ${Object.entries(attendancesByDate).map(([date, dayAttendances]) => `
        <div class="date-group">
          <div class="date-header">📅 ${date} - ${dayAttendances.length} Record${dayAttendances.length !== 1 ? 's' : ''}</div>
          <table class="attendance-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Time</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${dayAttendances.map((attendance: any) => `
                <tr>
                  <td>${attendance.student.firstName} ${attendance.student.lastName}</td>
                  <td>${attendance.student.studentId}</td>
                  <td>${attendance.class.name}</td>
                  <td>${attendance.subject.name}</td>
                  <td>${new Date(attendance.timetable.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${new Date(attendance.timetable.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td><span class="status-${attendance.status.toLowerCase()}">${attendance.status}</span></td>
                  <td>${attendance.notes || "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `).join("")}

      <div class="section-title">Student Summary</div>
      <table class="attendance-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Student ID</th>
            <th>Total Records</th>
            <th>Present</th>
            <th>Absent</th>
            <th>Late</th>
            <th>Excused</th>
            <th>Attendance Rate</th>
          </tr>
        </thead>
        <tbody>
          ${uniqueStudents.map((student: any) => {
            const studentAttendances = attendances.filter((a: any) => a.student.id === student.id);
            const studentTotal = studentAttendances.length;
            const studentPresent = studentAttendances.filter((a: any) => a.status === "PRESENT").length;
            const studentAbsent = studentAttendances.filter((a: any) => a.status === "ABSENT").length;
            const studentLate = studentAttendances.filter((a: any) => a.status === "LATE").length;
            const studentExcused = studentAttendances.filter((a: any) => a.status === "EXCUSED").length;
            const studentRate = studentTotal > 0 ? Math.round((studentPresent / studentTotal) * 100) : 0;
            
            return `
              <tr>
                <td>${student.firstName} ${student.lastName}</td>
                <td>${student.studentId}</td>
                <td>${studentTotal}</td>
                <td>${studentPresent}</td>
                <td>${studentAbsent}</td>
                <td>${studentLate}</td>
                <td>${studentExcused}</td>
                <td>${studentRate}%</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>

      <div class="footer">
        <p>This attendance report was generated for ${teacher.firstName} ${teacher.lastName} from ${teacher.branch.shortName}.</p>
        <p>For questions about attendance records, please contact the school administration.</p>
        <p>Report covers the period${startDate && endDate ? ` from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : " for all available data"}.</p>
      </div>
    </body>
    </html>
  `;

  const response = new NextResponse(htmlContent);
  response.headers.set("Content-Type", "text/html");
  response.headers.set("Content-Disposition", `attachment; filename="attendance_report_${teacher.lastName}_${reportType}.html"`);
  
  return response;
}

async function generateAttendanceExcel(data: any) {
  const { teacher, attendances, reportType, startDate, endDate } = data;
  
  // Calculate summary statistics
  const totalRecords = attendances.length;
  const presentCount = attendances.filter((a: any) => a.status === "PRESENT").length;
  const absentCount = attendances.filter((a: any) => a.status === "ABSENT").length;
  const lateCount = attendances.filter((a: any) => a.status === "LATE").length;
  const excusedCount = attendances.filter((a: any) => a.status === "EXCUSED").length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  // Generate CSV content (Excel-compatible)
  const csvRows = [
    // Header information
    [`Attendance Report - Teacher: ${teacher.firstName} ${teacher.lastName}`],
    [`Branch: ${teacher.branch.shortName} - ${teacher.branch.legalName}`],
    [`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`],
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
    
    // Detailed records
    ["DETAILED ATTENDANCE RECORDS"],
    ["Date", "Student Name", "Student ID", "Class", "Subject", "Start Time", "End Time", "Status", "Notes"],
    
    // Attendance data
    ...attendances.map((attendance: any) => [
      new Date(attendance.date).toLocaleDateString(),
      `${attendance.student.firstName} ${attendance.student.lastName}`,
      attendance.student.studentId,
      attendance.class.name,
      attendance.subject.name,
      new Date(attendance.timetable.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      new Date(attendance.timetable.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      attendance.status,
      attendance.notes || "",
    ]),
    
    [""], // Empty row
    
    // Student summary
    ["STUDENT SUMMARY"],
    ["Student Name", "Student ID", "Total Records", "Present", "Absent", "Late", "Excused", "Attendance Rate"],
    
    // Calculate and add student summaries
    ...(() => {
      const uniqueStudents = [...new Map(attendances.map((a: any) => [a.student.id, a.student])).values()];
      return uniqueStudents.map((student: any) => {
        const studentAttendances = attendances.filter((a: any) => a.student.id === student.id);
        const studentTotal = studentAttendances.length;
        const studentPresent = studentAttendances.filter((a: any) => a.status === "PRESENT").length;
        const studentAbsent = studentAttendances.filter((a: any) => a.status === "ABSENT").length;
        const studentLate = studentAttendances.filter((a: any) => a.status === "LATE").length;
        const studentExcused = studentAttendances.filter((a: any) => a.status === "EXCUSED").length;
        const studentRate = studentTotal > 0 ? Math.round((studentPresent / studentTotal) * 100) : 0;
        
        return [
          `${student.firstName} ${student.lastName}`,
          student.studentId,
          studentTotal,
          studentPresent,
          studentAbsent,
          studentLate,
          studentExcused,
          `${studentRate}%`,
        ];
      });
    })(),
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
  response.headers.set("Content-Disposition", `attachment; filename="attendance_report_${teacher.lastName}_${reportType}.csv"`);
  
  return response;
}
