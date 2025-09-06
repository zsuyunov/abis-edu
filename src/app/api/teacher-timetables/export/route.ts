import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

class AuthService {
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  static verifyToken(token: string): { id: string; user?: any } | null {
    try {
      const session = auth(token);
      return session;
    } catch (error) {
      return null;
    }
  }
}

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
    const format = url.searchParams.get("format") || "pdf";
    const view = url.searchParams.get("view") || "weekly";
    const branchId = url.searchParams.get("branchId");
    const academicYearId = url.searchParams.get("academicYearId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Build filter conditions
    const where: any = {
      teacherId,
      status: "ACTIVE",
    };

    if (branchId) where.branchId = parseInt(branchId);
    if (academicYearId) where.academicYearId = parseInt(academicYearId);
    if (classId) where.classId = parseInt(classId);
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
        class: {
          include: {
            supervisor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
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
        Class: timetable.class.name,
        Room: timetable.roomNumber,
        Building: timetable.buildingName || "",
        Status: timetable.status,
        "Topics Count": timetable.topics.length,
        "Has Topics": timetable.topics.length > 0 ? "Yes" : "No",
        "Completed Topics": timetable.topics.filter(t => t.status === "COMPLETED").length,
        "In Progress Topics": timetable.topics.filter(t => t.status === "IN_PROGRESS").length,
        Branch: timetable.branch.shortName,
        "Academic Year": timetable.academicYear.name,
      }));

      return NextResponse.json({ 
        data: excelData,
        filename: `teacher-timetables-${view}-${new Date().toISOString().split('T')[0]}.xlsx`
      });
    }

    if (format === "pdf") {
      // For PDF export, return HTML that can be converted to PDF
      const htmlContent = generateTimetableHTML(timetables, view, {
        teacherName: `${session.user.firstName} ${session.user.lastName}`,
        dateRange: startDate && endDate 
          ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
          : "All dates",
        view,
      });

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="teacher-timetables-${view}-${new Date().toISOString().split('T')[0]}.html"`,
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });

  } catch (error) {
    console.error("Error exporting timetables:", error);
    return NextResponse.json(
      { error: "Failed to export timetables" },
      { status: 500 }
    );
  }
}

function generateTimetableHTML(timetables: any[], view: string, metadata: any) {
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
      <title>Teacher Timetables - ${view}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .metadata { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .metadata p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #007bff; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .status-active { color: #28a745; font-weight: bold; }
        .status-inactive { color: #6c757d; font-weight: bold; }
        .topics-indicator { font-size: 12px; }
        .has-topics { color: #007bff; }
        .no-topics { color: #dc3545; }
      </style>
    </head>
    <body>
      <h1>Teacher Timetables Report</h1>
      
      <div class="metadata">
        <p><strong>Teacher:</strong> ${metadata.teacherName}</p>
        <p><strong>View:</strong> ${view.charAt(0).toUpperCase() + view.slice(1)}</p>
        <p><strong>Date Range:</strong> ${metadata.dateRange}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Lessons:</strong> ${timetables.length}</p>
      </div>

      ${Object.entries(groupedByDate).map(([date, dateTimetables]: [string, any]) => `
        <h2>${date}</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Subject</th>
              <th>Class</th>
              <th>Room</th>
              <th>Status</th>
              <th>Topics</th>
            </tr>
          </thead>
          <tbody>
            ${dateTimetables.map((timetable: any) => `
              <tr>
                <td>
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
                </td>
                <td>${timetable.subject.name}</td>
                <td>${timetable.class.name}</td>
                <td>${timetable.roomNumber}${timetable.buildingName ? ` (${timetable.buildingName})` : ''}</td>
                <td class="status-${timetable.status.toLowerCase()}">${timetable.status}</td>
                <td class="topics-indicator ${timetable.topics.length > 0 ? 'has-topics' : 'no-topics'}">
                  ${timetable.topics.length > 0 
                    ? `${timetable.topics.length} topic${timetable.topics.length > 1 ? 's' : ''} 
                       (${timetable.topics.filter((t: any) => t.status === 'COMPLETED').length} completed)`
                    : 'No topics'
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `).join('')}

      <div style="margin-top: 40px; font-size: 12px; color: #666;">
        <p>This report was generated automatically by the School Management System.</p>
      </div>
    </body>
    </html>
  `;

  return html;
}
