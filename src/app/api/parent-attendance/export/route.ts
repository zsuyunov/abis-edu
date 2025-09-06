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
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const format = url.searchParams.get("format") || "pdf"; // pdf or excel
    const reportType = url.searchParams.get("reportType") || "detailed"; // detailed, summary
    const includeClassAverage = url.searchParams.get("includeClassAverage") === "true";
    
    // Verify parent can only export their own data
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
    const targetChild = childId 
      ? parent.students.find(s => s.id === childId)
      : parent.students[0];

    if (!targetChild) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Build filter conditions
    const where: any = {
      studentId: targetChild.id,
      branchId: targetChild.branchId, // Always filter by child's branch
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

    // Get class average comparison if requested
    let classComparison = null;
    if (includeClassAverage) {
      try {
        const classAttendances = await prisma.attendance.findMany({
          where: {
            classId: targetChild.classId,
            branchId: targetChild.branchId,
            academicYearId: where.academicYearId || targetChild.class.academicYearId,
            ...(where.date && { date: where.date }),
            ...(subjectId && { subjectId: parseInt(subjectId) }),
          },
        });

        const totalClassAttendances = classAttendances.length;
        const classPresentCount = classAttendances.filter(a => a.status === "PRESENT").length;
        const classAttendanceRate = totalClassAttendances > 0 ? 
          Math.round((classPresentCount / totalClassAttendances) * 100) : 0;

        const studentsInClass = await prisma.student.count({
          where: {
            classId: targetChild.classId,
            branchId: targetChild.branchId,
            status: "ACTIVE",
          },
        });

        classComparison = {
          classAttendanceRate,
          studentsInClass,
          totalClassRecords: totalClassAttendances,
          classPresentCount,
        };
      } catch (error) {
        console.error("Error calculating class average:", error);
      }
    }

    // Generate export based on format
    if (format === "pdf") {
      return generateParentAttendancePDF({
        parent,
        child: targetChild,
        attendances,
        classComparison,
        reportType,
        startDate,
        endDate,
        subjectId,
        academicYearId,
        includeClassAverage,
      });
    } else if (format === "excel") {
      return generateParentAttendanceExcel({
        parent,
        child: targetChild,
        attendances,
        classComparison,
        reportType,
        startDate,
        endDate,
        subjectId,
        academicYearId,
        includeClassAverage,
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (error) {
    console.error("Error exporting parent attendance:", error);
    return NextResponse.json(
      { error: "Failed to export attendance data" },
      { status: 500 }
    );
  }
}

async function generateParentAttendancePDF(data: any) {
  const { parent, child, attendances, classComparison, reportType, startDate, endDate, includeClassAverage } = data;
  
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

  // Generate insights and recommendations
  const generateInsights = () => {
    const insights = [];
    
    if (attendanceRate >= 95) {
      insights.push("🌟 Outstanding attendance! Your child is setting an excellent example.");
    } else if (attendanceRate >= 85) {
      insights.push("✨ Good attendance performance. Keep up the positive momentum.");
    } else if (attendanceRate >= 75) {
      insights.push("📚 Attendance needs improvement. Consider establishing better routines.");
    } else {
      insights.push("⚠️ Critical attendance issue. Please contact the school immediately.");
    }

    if (lateCount > totalRecords * 0.1) {
      insights.push("⏰ Punctuality concern. Consider adjusting morning routines.");
    } else if (lateCount === 0 && totalRecords >= 10) {
      insights.push("⏰ Perfect punctuality! Your child is always on time.");
    }

    if (classComparison) {
      const comparison = attendanceRate - classComparison.classAttendanceRate;
      if (comparison > 5) {
        insights.push(`📊 Above class average! Your child's attendance (${attendanceRate}%) is ${comparison}% higher than the class average (${classComparison.classAttendanceRate}%).`);
      } else if (comparison < -5) {
        insights.push(`📊 Below class average. Your child's attendance (${attendanceRate}%) is ${Math.abs(comparison)}% lower than the class average (${classComparison.classAttendanceRate}%).`);
      } else {
        insights.push(`📊 On par with class. Your child's attendance (${attendanceRate}%) is similar to the class average (${classComparison.classAttendanceRate}%).`);
      }
    }

    return insights;
  };

  const insights = generateInsights();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Child Attendance Report - ${child.firstName} ${child.lastName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
        .parent-info { background: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
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
        .class-comparison { background: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 30px 0; }
        .comparison-title { font-weight: bold; color: #92400e; margin-bottom: 15px; font-size: 18px; }
        .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .comparison-item { background: white; padding: 15px; border-radius: 6px; text-align: center; }
        .comparison-number { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .comparison-label { font-size: 12px; color: #6b7280; }
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
        .insights { background: #e0f2fe; border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 30px 0; }
        .insights-title { font-weight: bold; color: #0c4a6e; margin-bottom: 15px; font-size: 18px; }
        .insight-item { margin: 10px 0; padding: 10px; background: #f0f9ff; border-radius: 4px; border-left: 4px solid #0ea5e9; }
        .recommendations { background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0; }
        .recommendations-title { font-weight: bold; color: #047857; margin-bottom: 15px; font-size: 18px; }
        .recommendation-item { margin: 8px 0; padding: 8px; background: white; border-radius: 4px; border-left: 4px solid #10b981; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>👨‍👩‍👧‍👦 Child Attendance Report</h1>
        <h2>${child.firstName} ${child.lastName} (${child.studentId})</h2>
        <p><strong>Class:</strong> ${child.class.name} | <strong>Branch:</strong> ${child.branch.shortName}</p>
        <p><strong>Academic Year:</strong> ${child.class.academicYear.name}</p>
        <p><strong>Report for Parent:</strong> ${parent.firstName} ${parent.lastName}</p>
        ${startDate && endDate ? `<p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>` : ""}
        <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "long", 
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}</p>
      </div>

      <div class="parent-info">
        <div class="info-section">
          <div class="info-label">Child Information</div>
          <div class="info-value">
            <strong>Name:</strong> ${child.firstName} ${child.lastName}<br>
            <strong>Student ID:</strong> ${child.studentId}<br>
            <strong>Class:</strong> ${child.class.name}<br>
            <strong>Branch:</strong> ${child.branch.legalName}
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
            <strong>Parent Access:</strong> ${parent.firstName} ${parent.lastName}
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

      ${classComparison && includeClassAverage ? `
      <div class="class-comparison">
        <div class="comparison-title">📈 Class Comparison</div>
        <p>Compare ${child.firstName}'s attendance with class average (${classComparison.studentsInClass} students)</p>
        <div class="comparison-grid">
          <div class="comparison-item">
            <div class="comparison-number" style="color: #0284c7;">${attendanceRate}%</div>
            <div class="comparison-label">${child.firstName}'s Rate</div>
          </div>
          <div class="comparison-item">
            <div class="comparison-number" style="color: #7c3aed;">${classComparison.classAttendanceRate}%</div>
            <div class="comparison-label">Class Average</div>
          </div>
        </div>
        <div style="margin-top: 15px; text-align: center; font-weight: 500;">
          ${attendanceRate > classComparison.classAttendanceRate ? 
            `🎉 ${child.firstName} is performing ${attendanceRate - classComparison.classAttendanceRate}% above class average!` :
            attendanceRate < classComparison.classAttendanceRate ?
            `⚠️ ${child.firstName} is ${classComparison.classAttendanceRate - attendanceRate}% below class average.` :
            `✅ ${child.firstName} is performing at class average level.`}
        </div>
      </div>
      ` : ""}

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

      <div class="insights">
        <div class="insights-title">💡 Attendance Insights</div>
        ${insights.map(insight => `<div class="insight-item">${insight}</div>`).join("")}
      </div>

      <div class="recommendations">
        <div class="recommendations-title">🎯 Recommendations for Parents</div>
        ${attendanceRate < 85 ? 
          '<div class="recommendation-item">📚 Establish a consistent daily routine to help with regular school attendance.</div>' : ''}
        ${lateCount > totalRecords * 0.1 ? 
          '<div class="recommendation-item">⏰ Consider adjusting bedtime and morning routines to improve punctuality.</div>' : ''}
        ${attendanceRate >= 95 ? 
          '<div class="recommendation-item">🎉 Continue the excellent work! Your child\'s attendance is outstanding.</div>' : 
          '<div class="recommendation-item">📈 Work towards achieving and maintaining 95% attendance for optimal academic success.</div>'}
        <div class="recommendation-item">📞 Maintain regular communication with teachers about attendance and academic progress.</div>
        <div class="recommendation-item">🏥 Schedule regular health check-ups to prevent illness-related absences.</div>
        <div class="recommendation-item">🛏️ Ensure your child gets 8-10 hours of sleep per night for better health and attendance.</div>
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

      <div class="footer">
        <p>This attendance report was generated for parent ${parent.firstName} ${parent.lastName} regarding ${child.firstName} ${child.lastName} from ${child.branch.shortName}.</p>
        <p>For questions about attendance records or to discuss your child's progress, please contact your child's teachers or school administration.</p>
        <p>Report covers${startDate && endDate ? ` the period from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : " all available attendance data"}.</p>
        <p style="margin-top: 15px; font-style: italic;">Remember: Regular attendance is crucial for your child's academic success! 📚✨</p>
      </div>
    </body>
    </html>
  `;

  const response = new NextResponse(htmlContent);
  response.headers.set("Content-Type", "text/html");
  response.headers.set("Content-Disposition", `attachment; filename="child_attendance_report_${child.lastName}_${reportType}.html"`);
  
  return response;
}

async function generateParentAttendanceExcel(data: any) {
  const { parent, child, attendances, classComparison, reportType, startDate, endDate, includeClassAverage } = data;
  
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
    [`Child Attendance Report - ${child.firstName} ${child.lastName}`],
    [`Parent: ${parent.firstName} ${parent.lastName}`],
    [`Student ID: ${child.studentId}`],
    [`Class: ${child.class.name}`],
    [`Branch: ${child.branch.shortName} - ${child.branch.legalName}`],
    [`Academic Year: ${child.class.academicYear.name}`],
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

    // Class comparison if available
    ...(classComparison && includeClassAverage ? [
      ["CLASS COMPARISON"],
      ["Metric", "Your Child", "Class Average", "Difference"],
      ["Attendance Rate", `${attendanceRate}%`, `${classComparison.classAttendanceRate}%`, `${attendanceRate - classComparison.classAttendanceRate > 0 ? '+' : ''}${attendanceRate - classComparison.classAttendanceRate}%`],
      ["Students in Class", "", classComparison.studentsInClass, ""],
      [""], // Empty row
    ] : []),

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
    
    // Insights and recommendations
    ["INSIGHTS & RECOMMENDATIONS"],
    ["Category", "Insight/Recommendation"],
    ["Overall Performance", attendanceRate >= 95 ? "Excellent attendance! Keep up the great work!" : 
                          attendanceRate >= 85 ? "Good attendance. Continue the positive momentum." :
                          attendanceRate >= 75 ? "Attendance needs improvement. Consider better routines." :
                          "Critical attendance issue. Contact school immediately."],
    
    ...(lateCount > totalRecords * 0.1 ? [["Punctuality", "Consider adjusting morning routines to improve punctuality."]] : []),
    ...(classComparison ? [["Class Comparison", `Your child's attendance is ${attendanceRate > classComparison.classAttendanceRate ? 'above' : attendanceRate < classComparison.classAttendanceRate ? 'below' : 'at'} class average (${classComparison.classAttendanceRate}%).`]] : []),
    ["General Advice", "Maintain regular communication with teachers about attendance and progress."],
    ["Health", "Ensure adequate sleep (8-10 hours) and regular health check-ups."],
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
  response.headers.set("Content-Disposition", `attachment; filename="child_attendance_report_${child.lastName}_${reportType}.csv"`);
  
  return response;
}
