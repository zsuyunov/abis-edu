import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function POST(request: NextRequest) {
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

    const { studentId, format, academicYearId } = await request.json();

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
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (!student.classId) {
      return NextResponse.json({ error: "Student class information is missing" }, { status: 400 });
    }

    // Get academic year (current or specified)
    const targetAcademicYear = academicYearId 
      ? await prisma.academicYear.findUnique({ where: { id: academicYearId } })
      : await prisma.academicYear.findFirst({ where: { isCurrent: true, status: "ACTIVE" } });

    if (!targetAcademicYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // Get timetable data
    const timetables = await prisma.timetable.findMany({
      where: {
        classId: student.classId,
        academicYearId: targetAcademicYear.id,
        isActive: true,
      },
      include: {
        class: true,
      },
      orderBy: [
        { startTime: "asc" },
      ],
    });

    // Generate calendar content based on format
    if (format === "ics") {
      const icsContent = generateICSContent(timetables, student, targetAcademicYear);
      return NextResponse.json({
        icsContent,
        subscriptionUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/student-timetables/calendar-feed/${studentId}?year=${targetAcademicYear.id}`,
      });
    }

    if (format === "google") {
      const googleCalendarUrl = generateGoogleCalendarUrl(timetables);
      return NextResponse.json({
        googleCalendarUrl,
        subscriptionUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/student-timetables/calendar-feed/${studentId}?year=${targetAcademicYear.id}`,
      });
    }

    if (format === "outlook") {
      const outlookUrl = generateOutlookUrl(timetables);
      return NextResponse.json({
        outlookUrl,
        subscriptionUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/student-timetables/calendar-feed/${studentId}?year=${targetAcademicYear.id}`,
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (error) {
    console.error("Error generating calendar sync:", error);
    return NextResponse.json(
      { error: "Failed to generate calendar sync" },
      { status: 500 }
    );
  }
}

function generateICSContent(timetables: any[], student: any, academicYear: any): string {
  const now = new Date();
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ABIS EDU//Student Timetable//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${student.firstName} ${student.lastName} - ${academicYear.name} Timetable`,
    `X-WR-CALDESC:Class timetable for ${student.class.name}`,
  ];

  timetables.forEach((timetable) => {
    const startDateTime = new Date(timetable.startTime);
    const endDateTime = new Date(timetable.endTime);
    
    // Format dates for ICS (YYYYMMDDTHHMMSSZ)
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const uid = `timetable-${timetable.id}@school-system.com`;
    const summary = `Class ${timetable.class.name}`; // Updated due to schema changes
    const description = [
      `Teacher: TBA`, // Updated due to schema changes
      `Room: ${timetable.room || 'TBA'}`,
      `Class: ${student.class.name}`,
    ];

    if (timetable.topics.length > 0) {
      description.push('', 'Topics:');
      timetable.topics.forEach((topic: any) => {
        description.push(`• ${topic.title}`);
        if (topic.description) {
          description.push(`  ${topic.description}`);
        }
      });
    }

    icsLines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatICSDate(now)}`,
      `DTSTART:${formatICSDate(startDateTime)}`,
      `DTEND:${formatICSDate(endDateTime)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description.join('\\n')}`,
      `LOCATION:${timetable.room || 'TBA'}`,
      `ORGANIZER;CN=Teacher:MAILTO:noreply@school.com`, // Updated due to schema changes
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT"
    );
  });

  icsLines.push("END:VCALENDAR");
  return icsLines.join('\r\n');
}

function generateGoogleCalendarUrl(timetables: any[]): string {
  if (timetables.length === 0) return "";
  
  // For Google Calendar, we'll create a URL for the first event as an example
  const firstTimetable = timetables[0];
  const startTime = new Date(firstTimetable.startTime);
  const endTime = new Date(firstTimetable.endTime);
  
  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${firstTimetable.subject.name} - Class Timetable`,
    dates: `${formatGoogleDate(startTime)}/${formatGoogleDate(endTime)}`,
    details: `Teacher: ${firstTimetable.teacher.firstName} ${firstTimetable.teacher.lastName}\nRoom: ${firstTimetable.room || 'TBA'}`,
    location: firstTimetable.room || 'TBA',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function generateOutlookUrl(timetables: any[]): string {
  if (timetables.length === 0) return "";
  
  // For Outlook, we'll create a URL for the first event as an example
  const firstTimetable = timetables[0];
  const startTime = new Date(firstTimetable.startTime);
  const endTime = new Date(firstTimetable.endTime);
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: `${firstTimetable.subject.name} - Class Timetable`,
    startdt: startTime.toISOString(),
    enddt: endTime.toISOString(),
    body: `Teacher: ${firstTimetable.teacher.firstName} ${firstTimetable.teacher.lastName}\nRoom: ${firstTimetable.room || 'TBA'}`,
    location: firstTimetable.room || 'TBA',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}