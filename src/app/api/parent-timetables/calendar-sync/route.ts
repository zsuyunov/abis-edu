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

    const body = await request.json();
    const { parentId, childId, format, syncAllChildren, academicYearId } = body;

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

    // Determine target children
    let targetChildren = parent.students;
    if (!syncAllChildren && childId) {
      const targetChild = parent.students.find(child => child.id === childId);
      if (!targetChild) {
        return NextResponse.json({ error: "Child not found" }, { status: 404 });
      }
      targetChildren = [targetChild];
    }

    // Get current academic year if not specified
    let targetAcademicYearId = academicYearId;
    if (!targetAcademicYearId) {
      const currentAcademicYear = await prisma.academicYear.findFirst({
        where: { isCurrent: true, status: "ACTIVE" },
      });
      targetAcademicYearId = currentAcademicYear?.id;
    }

    if (!targetAcademicYearId) {
      return NextResponse.json({ error: "No academic year data available" }, { status: 404 });
    }

    // Fetch timetables for all target children
    const allTimetables = [];
    for (const child of targetChildren) {
      const timetables = await prisma.timetable.findMany({
        where: {
          classId: child.classId,
          academicYearId: targetAcademicYearId,
          status: "ACTIVE",
        },
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

      allTimetables.push(...timetables.map(t => ({ ...t, childName: `${child.firstName} ${child.lastName}` })));
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    if (format === "ics") {
      const icsContent = generateICSContent(allTimetables, parent, syncAllChildren);
      const subscriptionUrl = `${baseUrl}/api/parent-timetables/calendar-sync/subscribe?parentId=${parentId}&childId=${childId || ''}&academicYearId=${targetAcademicYearId}`;
      
      return NextResponse.json({
        icsContent,
        subscriptionUrl,
        childName: syncAllChildren ? "Family" : targetChildren[0]?.firstName,
      });
    } else if (format === "google") {
      const googleCalendarUrl = generateGoogleCalendarUrl(allTimetables[0], syncAllChildren);
      return NextResponse.json({ googleCalendarUrl });
    } else if (format === "outlook") {
      const outlookUrl = generateOutlookUrl(allTimetables[0], syncAllChildren);
      return NextResponse.json({ outlookUrl });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (error) {
    console.error("Error syncing parent calendar:", error);
    return NextResponse.json(
      { error: "Failed to sync calendar" },
      { status: 500 }
    );
  }
}

function generateICSContent(timetables: any[], parent: any, syncAllChildren: boolean) {
  const now = new Date();
  const calendarName = syncAllChildren ? `${parent.firstName} ${parent.lastName} - Family Timetable` : `${parent.firstName} ${parent.lastName} - Child Timetable`;
  
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//School Management System//Parent Timetable//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${calendarName}
X-WR-TIMEZONE:UTC
X-WR-CALDESC:${syncAllChildren ? 'Combined family' : 'Child'} timetable for academic planning
`;

  timetables.forEach((timetable) => {
    const startDateTime = new Date(timetable.fullDate + 'T' + new Date(timetable.startTime).toTimeString().split(' ')[0]);
    const endDateTime = new Date(timetable.fullDate + 'T' + new Date(timetable.endTime).toTimeString().split(' ')[0]);
    
    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const summary = syncAllChildren 
      ? `${timetable.childName} - ${timetable.subject.name}`
      : timetable.subject.name;
    
    const description = `Subject: ${timetable.subject.name}\\n` +
      `Teacher: ${timetable.teacher.firstName} ${timetable.teacher.lastName}\\n` +
      `Room: ${timetable.roomNumber}\\n` +
      `Class: ${timetable.class.name}\\n` +
      (syncAllChildren ? `Student: ${timetable.childName}\\n` : '') +
      (timetable.topics.length > 0 ? `\\nTopics: ${timetable.topics.map((t: any) => t.title).join(', ')}` : '');

    icsContent += `BEGIN:VEVENT
UID:${timetable.id}-${now.getTime()}@schoolsystem.com
DTSTART:${formatDateForICS(startDateTime)}
DTEND:${formatDateForICS(endDateTime)}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:Room ${timetable.roomNumber}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`;
  });

  icsContent += 'END:VCALENDAR';
  return icsContent;
}

function generateGoogleCalendarUrl(timetable: any, syncAllChildren: boolean) {
  const startDateTime = new Date(timetable.fullDate + 'T' + new Date(timetable.startTime).toTimeString().split(' ')[0]);
  const endDateTime = new Date(timetable.fullDate + 'T' + new Date(timetable.endTime).toTimeString().split(' ')[0]);
  
  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const title = syncAllChildren 
    ? `${timetable.childName} - ${timetable.subject.name}`
    : timetable.subject.name;
  
  const details = `Subject: ${timetable.subject.name}\n` +
    `Teacher: ${timetable.teacher.firstName} ${timetable.teacher.lastName}\n` +
    `Room: ${timetable.roomNumber}\n` +
    `Class: ${timetable.class.name}` +
    (syncAllChildren ? `\nStudent: ${timetable.childName}` : '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDateForGoogle(startDateTime)}/${formatDateForGoogle(endDateTime)}`,
    details: details,
    location: `Room ${timetable.roomNumber}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function generateOutlookUrl(timetable: any, syncAllChildren: boolean) {
  const startDateTime = new Date(timetable.fullDate + 'T' + new Date(timetable.startTime).toTimeString().split(' ')[0]);
  const endDateTime = new Date(timetable.fullDate + 'T' + new Date(timetable.endTime).toTimeString().split(' ')[0]);
  
  const title = syncAllChildren 
    ? `${timetable.childName} - ${timetable.subject.name}`
    : timetable.subject.name;
  
  const body = `Subject: ${timetable.subject.name}\n` +
    `Teacher: ${timetable.teacher.firstName} ${timetable.teacher.lastName}\n` +
    `Room: ${timetable.roomNumber}\n` +
    `Class: ${timetable.class.name}` +
    (syncAllChildren ? `\nStudent: ${timetable.childName}` : '');

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: startDateTime.toISOString(),
    enddt: endDateTime.toISOString(),
    body: body,
    location: `Room ${timetable.roomNumber}`,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
