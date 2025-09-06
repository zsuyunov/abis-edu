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
    const format = url.searchParams.get("format") || "pdf";
    const view = url.searchParams.get("view") || "weekly";
    const timeFilter = url.searchParams.get("timeFilter") || "current";
    const academicYearId = url.searchParams.get("academicYearId");
    const subjectId = url.searchParams.get("subjectId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Verify access
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
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get academic year
    let targetAcademicYearId;
    if (academicYearId) {
      targetAcademicYearId = parseInt(academicYearId);
    } else if (timeFilter === "current") {
      const currentAcademicYear = await prisma.academicYear.findFirst({
        where: { isCurrent: true, status: "ACTIVE" },
      });
      targetAcademicYearId = currentAcademicYear?.id || student.class.academicYearId;
    } else {
      const pastAcademicYears = await prisma.academicYear.findMany({
        where: { isCurrent: false },
        orderBy: { startDate: "desc" },
        take: 1,
      });
      targetAcademicYearId = pastAcademicYears[0]?.id;
    }

    if (!targetAcademicYearId) {
      return NextResponse.json({ error: "No academic year found" }, { status: 404 });
    }

    // Build filter conditions
    const where: any = {
      classId: student.classId,
      academicYearId: targetAcademicYearId,
      status: "ACTIVE",
    };

    if (subjectId) where.subjectId = parseInt(subjectId);

    // Date filtering
    if (startDate && endDate) {
      where.fullDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get timetables with related data
    const timetables = await prisma.timetable.findMany({
      where,
      include: {
        class: true,
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        branch: true,
        academicYear: true,
        topics: {
          where: {
            status: {
              in: ["COMPLETED", "IN_PROGRESS"],
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: [
        { fullDate: "asc" },
        { startTime: "asc" },
      ],
    });

    if (format === "excel") {
      // For Excel export, return JSON data that frontend can process
      const excelData = timetables.map(timetable => ({
        Date: new Date(timetable.fullDate).toLocaleDateString(),
        Day: timetable.day,
        "Start Time": new Date(timetable.startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        "End Time": new Date(timetable.endTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        Subject: timetable.subject.name,
        Teacher: `${timetable.teacher.firstName} ${timetable.teacher.lastName}`,
        Room: timetable.roomNumber,
        Building: timetable.buildingName || "",
        Status: timetable.status,
        "Topics Count": timetable.topics.length,
        "Has Topics": timetable.topics.length > 0 ? "Yes" : "No",
        "Completed Topics": timetable.topics.filter(t => t.status === "COMPLETED").length,
        "In Progress Topics": timetable.topics.filter(t => t.status === "IN_PROGRESS").length,
        "Latest Topic": timetable.topics[0]?.title || "No topics",
        Branch: timetable.branch.shortName,
        "Academic Year": timetable.academicYear.name,
      }));

      return NextResponse.json({ 
        data: excelData,
        filename: `my-timetable-${view}-${timeFilter}-${new Date().toISOString().split('T')[0]}.xlsx`
      });
    }

    if (format === "pdf") {
      // For PDF export, return HTML that can be converted to PDF
      const htmlContent = generateStudentTimetableHTML(timetables, view, {
        studentName: `${student.firstName} ${student.lastName}`,
        studentId: student.studentId,
        className: student.class.name,
        branchName: student.branch.shortName,
        academicYear: timetables[0]?.academicYear.name || "N/A",
        dateRange: startDate && endDate 
          ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
          : "All dates",
        view,
        timeFilter,
      });

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="my-timetable-${view}-${timeFilter}-${new Date().toISOString().split('T')[0]}.html"`,
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });

  } catch (error) {
    console.error("Error exporting student timetables:", error);
    return NextResponse.json(
      { error: "Failed to export timetables" },
      { status: 500 }
    );
  }
}

function generateStudentTimetableHTML(timetables: any[], view: string, metadata: any) {
  const groupedByDate = timetables.reduce((acc, timetable) => {
    const date = new Date(timetable.fullDate).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(timetable);
    return acc;
  }, {});

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>My Class Timetable - ${view}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header .subtitle { margin: 10px 0 0 0; opacity: 0.9; }
        .metadata { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #667eea; }
        .metadata h2 { margin: 0 0 15px 0; color: #667eea; }
        .metadata-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metadata-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .metadata-label { font-weight: 600; color: #495057; }
        .metadata-value { color: #6c757d; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; }
        th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        tr:hover { background-color: #e3f2fd; }
        .date-header { background: #e3f2fd; color: #1976d2; font-weight: bold; font-size: 16px; padding: 15px 12px; margin: 20px 0 10px 0; border-radius: 5px; }
        .subject-cell { font-weight: 600; color: #1976d2; }
        .teacher-cell { color: #666; font-style: italic; }
        .time-cell { font-family: monospace; background: #f1f3f4; border-radius: 4px; padding: 4px 8px; display: inline-block; }
        .topics-cell { font-size: 12px; }
        .topic-badge { display: inline-block; padding: 2px 6px; border-radius: 3px; margin: 1px; font-size: 11px; }
        .topic-completed { background: #c8e6c9; color: #2e7d32; }
        .topic-progress { background: #bbdefb; color: #1976d2; }
        .topic-none { background: #f5f5f5; color: #757575; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .summary-box { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .summary-title { font-weight: bold; color: #1976d2; margin-bottom: 10px; }
        .summary-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .stat-item { text-align: center; padding: 10px; background: white; border-radius: 5px; }
        .stat-number { font-size: 18px; font-weight: bold; color: #1976d2; }
        .stat-label { font-size: 12px; color: #666; }
        .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
        .status-active { background: #c8e6c9; color: #2e7d32; }
        .status-inactive { background: #ffcdd2; color: #c62828; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>My Class Timetable</h1>
        <div class="subtitle">${metadata.timeFilter === "current" ? "Current Schedule" : "Archived Schedule"} • ${view.charAt(0).toUpperCase() + view.slice(1)} View</div>
      </div>
      
      <div class="metadata">
        <h2>Student Information</h2>
        <div class="metadata-grid">
          <div class="metadata-item">
            <span class="metadata-label">Student Name:</span>
            <span class="metadata-value">${metadata.studentName}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Student ID:</span>
            <span class="metadata-value">${metadata.studentId}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Class:</span>
            <span class="metadata-value">${metadata.className}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Branch:</span>
            <span class="metadata-value">${metadata.branchName}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Academic Year:</span>
            <span class="metadata-value">${metadata.academicYear}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Date Range:</span>
            <span class="metadata-value">${metadata.dateRange}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Generated:</span>
            <span class="metadata-value">${new Date().toLocaleString()}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Total Classes:</span>
            <span class="metadata-value">${timetables.length}</span>
          </div>
        </div>
      </div>

      <div class="summary-box">
        <div class="summary-title">Schedule Summary</div>
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-number">${timetables.length}</div>
            <div class="stat-label">Total Classes</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${timetables.filter(t => t.topics.length > 0).length}</div>
            <div class="stat-label">Classes with Topics</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${timetables.reduce((sum, t) => sum + t.topics.length, 0)}</div>
            <div class="stat-label">Total Topics</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${timetables.reduce((sum, t) => sum + t.topics.filter(topic => topic.status === 'COMPLETED').length, 0)}</div>
            <div class="stat-label">Completed Topics</div>
          </div>
        </div>
      </div>

      ${Object.entries(groupedByDate).map(([date, dateTimetables]: [string, any]) => `
        <div class="date-header">📅 ${date}</div>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Subject</th>
              <th>Teacher</th>
              <th>Room</th>
              <th>Status</th>
              <th>Topics</th>
            </tr>
          </thead>
          <tbody>
            ${dateTimetables.map((timetable: any) => `
              <tr>
                <td>
                  <span class="time-cell">
                    ${new Date(timetable.startTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })} - 
                    ${new Date(timetable.endTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                </td>
                <td class="subject-cell">${timetable.subject.name}</td>
                <td class="teacher-cell">${timetable.teacher.firstName} ${timetable.teacher.lastName}</td>
                <td>${timetable.roomNumber}${timetable.buildingName ? ` (${timetable.buildingName})` : ''}</td>
                <td><span class="status-badge status-${timetable.status.toLowerCase()}">${timetable.status}</span></td>
                <td class="topics-cell">
                  ${timetable.topics.length === 0 
                    ? '<span class="topic-badge topic-none">No topics</span>'
                    : timetable.topics.map((topic: any) => 
                        `<span class="topic-badge topic-${topic.status === 'COMPLETED' ? 'completed' : 'progress'}">${topic.title}</span>`
                      ).join(' ')
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `).join('')}

      <div class="footer">
        <p><strong>📚 Study Tips:</strong></p>
        <p>• Review lesson topics before attending classes for better preparation</p>
        <p>• Use completed topics as study materials for exams and assignments</p>
        <p>• Stay updated with new topics added by your teachers</p>
        <br>
        <p>This timetable was generated automatically by the School Management System.</p>
        <p>For the most up-to-date information, please check the online portal.</p>
      </div>
    </body>
    </html>
  `;

  return html;
}
