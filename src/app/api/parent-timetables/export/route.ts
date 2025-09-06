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
    const parentId = url.searchParams.get("parentId") || session.id;
    const childId = url.searchParams.get("childId");
    const academicYearId = url.searchParams.get("academicYearId");
    const subjectId = url.searchParams.get("subjectId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const format = url.searchParams.get("format") || "pdf"; // pdf or excel
    const timeFilter = url.searchParams.get("timeFilter") || "current";
    
    // Verify access
    if (session.id !== parentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get parent and children information
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

    if (!parent || parent.students.length === 0) {
      return NextResponse.json({ error: "Parent or children not found" }, { status: 404 });
    }

    // Determine target child
    let targetChild;
    if (childId) {
      targetChild = parent.students.find(child => child.id === childId);
    } else {
      targetChild = parent.students[0]; // Default to first child
    }

    if (!targetChild) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Get academic years
    let availableAcademicYears;
    if (timeFilter === "current") {
      availableAcademicYears = await prisma.academicYear.findMany({
        where: { isCurrent: true, status: "ACTIVE" },
        orderBy: { startDate: "desc" },
      });
    } else {
      availableAcademicYears = await prisma.academicYear.findMany({
        where: { isCurrent: false },
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

    // Build filter conditions
    const where: any = {
      classId: targetChild.classId,
      academicYearId: targetAcademicYearId,
      status: "ACTIVE",
    };

    if (subjectId) where.subjectId = parseInt(subjectId);
    if (startDate && endDate) {
      where.fullDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch timetables
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
            email: true,
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
          include: {
            teacher: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [
        { fullDate: "asc" },
        { startTime: "asc" },
      ],
    });

    const currentAcademicYear = availableAcademicYears.find(ay => ay.id === targetAcademicYearId);

    // Generate export content based on format
    if (format === "pdf") {
      return generatePDF({
        parent,
        child: targetChild,
        timetables,
        academicYear: currentAcademicYear,
        timeFilter,
        startDate,
        endDate,
      });
    } else if (format === "excel") {
      return generateExcel({
        parent,
        child: targetChild,
        timetables,
        academicYear: currentAcademicYear,
        timeFilter,
        startDate,
        endDate,
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (error) {
    console.error("Error exporting parent timetables:", error);
    return NextResponse.json(
      { error: "Failed to export timetables" },
      { status: 500 }
    );
  }
}

async function generatePDF(data: any) {
  const { parent, child, timetables, academicYear, timeFilter, startDate, endDate } = data;
  
  // Simple HTML structure for PDF generation
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${child.firstName} ${child.lastName} - Timetable</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-box { background: #F3F4F6; padding: 15px; border-radius: 8px; }
        .info-label { font-weight: bold; color: #374151; }
        .info-value { color: #6B7280; margin-top: 5px; }
        .timetable { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .timetable th, .timetable td { border: 1px solid #D1D5DB; padding: 12px; text-align: left; }
        .timetable th { background: #4F46E5; color: white; font-weight: bold; }
        .timetable tr:nth-child(even) { background: #F9FAFB; }
        .topics { margin-top: 10px; }
        .topic { background: #EFF6FF; padding: 8px; margin: 5px 0; border-radius: 4px; font-size: 12px; }
        .topic-title { font-weight: bold; color: #1E40AF; }
        .topic-desc { color: #374151; margin-top: 4px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #D1D5DB; text-align: center; color: #6B7280; font-size: 12px; }
        .summary { background: #F0F9FF; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-title { font-size: 18px; font-weight: bold; color: #1E40AF; margin-bottom: 15px; }
        .summary-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .stat-box { text-align: center; background: white; padding: 15px; border-radius: 6px; }
        .stat-number { font-size: 24px; font-weight: bold; color: #4F46E5; }
        .stat-label { font-size: 12px; color: #6B7280; margin-top: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${child.firstName} ${child.lastName}'s Class Timetable</h1>
        <p>Generated for Parent: ${parent.firstName} ${parent.lastName}</p>
        <p>${timeFilter === "current" ? "Current" : "Archived"} Academic Year: ${academicYear?.name || "N/A"}</p>
        ${startDate && endDate ? `<p>Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>` : ""}
      </div>

      <div class="info-grid">
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
            Status: ${timeFilter === "current" ? "Active" : "Archived"}
          </div>
        </div>
      </div>

      <div class="summary">
        <div class="summary-title">Timetable Summary</div>
        <div class="summary-stats">
          <div class="stat-box">
            <div class="stat-number">${timetables.length}</div>
            <div class="stat-label">Total Classes</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${timetables.filter((t: any) => t.topics.length > 0).length}</div>
            <div class="stat-label">With Topics</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${timetables.reduce((sum: number, t: any) => sum + t.topics.length, 0)}</div>
            <div class="stat-label">Total Topics</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${new Set(timetables.map((t: any) => t.subject.id)).size}</div>
            <div class="stat-label">Subjects</div>
          </div>
        </div>
      </div>

      <table class="timetable">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Subject</th>
            <th>Teacher</th>
            <th>Room</th>
            <th>Topics & Notes</th>
          </tr>
        </thead>
        <tbody>
          ${timetables.map((timetable: any) => `
            <tr>
              <td>${new Date(timetable.fullDate).toLocaleDateString("en-US", { 
                weekday: "short", 
                year: "numeric", 
                month: "short", 
                day: "numeric" 
              })}</td>
              <td>${new Date(timetable.startTime).toLocaleTimeString("en-US", { 
                hour: "2-digit", 
                minute: "2-digit", 
                hour12: true 
              })} - ${new Date(timetable.endTime).toLocaleTimeString("en-US", { 
                hour: "2-digit", 
                minute: "2-digit", 
                hour12: true 
              })}</td>
              <td><strong>${timetable.subject.name}</strong></td>
              <td>${timetable.teacher.firstName} ${timetable.teacher.lastName}</td>
              <td>Room ${timetable.roomNumber}</td>
              <td>
                ${timetable.topics.length > 0 ? `
                  <div class="topics">
                    ${timetable.topics.map((topic: any) => `
                      <div class="topic">
                        <div class="topic-title">${topic.title}</div>
                        ${topic.description ? `<div class="topic-desc">${topic.description}</div>` : ""}
                        <div style="font-size: 10px; color: #6B7280; margin-top: 4px;">
                          Status: ${topic.status} | Progress: ${topic.progressPercentage}%
                        </div>
                      </div>
                    `).join("")}
                  </div>
                ` : '<em style="color: #9CA3AF;">No topics available</em>'}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div class="footer">
        <p>This timetable was exported for home study planning purposes.</p>
        <p>Generated on ${new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "long", 
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}</p>
        <p>For questions about lesson content, please contact the respective subject teachers.</p>
      </div>
    </body>
    </html>
  `;

  // For a real implementation, you would use a PDF generation library like puppeteer or jsPDF
  // For now, we'll return the HTML content that can be printed to PDF
  const response = new NextResponse(htmlContent);
  response.headers.set("Content-Type", "text/html");
  response.headers.set("Content-Disposition", `attachment; filename="${child.firstName}_${child.lastName}_timetable.html"`);
  
  return response;
}

async function generateExcel(data: any) {
  const { parent, child, timetables, academicYear, timeFilter, startDate, endDate } = data;
  
  // Generate CSV content (Excel-compatible)
  const csvRows = [
    // Header information
    [`${child.firstName} ${child.lastName}'s Class Timetable`],
    [`Parent: ${parent.firstName} ${parent.lastName}`],
    [`Academic Year: ${academicYear?.name || "N/A"}`],
    [`Period: ${startDate ? new Date(startDate).toLocaleDateString() : "All"} - ${endDate ? new Date(endDate).toLocaleDateString() : "All"}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [""], // Empty row
    
    // Column headers
    ["Date", "Day", "Start Time", "End Time", "Subject", "Teacher", "Room", "Status", "Topics Count", "Topic Titles", "Topic Descriptions", "Topic Progress"],
    
    // Data rows
    ...timetables.map((timetable: any) => [
      new Date(timetable.fullDate).toLocaleDateString(),
      new Date(timetable.fullDate).toLocaleDateString("en-US", { weekday: "long" }),
      new Date(timetable.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      new Date(timetable.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      timetable.subject.name,
      `${timetable.teacher.firstName} ${timetable.teacher.lastName}`,
      `Room ${timetable.roomNumber}`,
      timetable.status,
      timetable.topics.length,
      timetable.topics.map((t: any) => t.title).join("; "),
      timetable.topics.map((t: any) => t.description || "").join("; "),
      timetable.topics.map((t: any) => `${t.title}: ${t.progressPercentage}%`).join("; "),
    ]),
    
    [""], // Empty row
    ["Summary"],
    ["Total Classes", timetables.length],
    ["Classes with Topics", timetables.filter((t: any) => t.topics.length > 0).length],
    ["Total Topics", timetables.reduce((sum: number, t: any) => sum + t.topics.length, 0)],
    ["Unique Subjects", new Set(timetables.map((t: any) => t.subject.id)).size],
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
  response.headers.set("Content-Disposition", `attachment; filename="${child.firstName}_${child.lastName}_timetable.csv"`);
  
  return response;
}
