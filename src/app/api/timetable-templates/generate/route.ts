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

// Helper function to get day of week from date
function getDayOfWeek(date: Date): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
}

// Helper function to check if date should be excluded
function isDateExcluded(date: Date, excludeDates: Date[]): boolean {
  return excludeDates.some(excludeDate => 
    date.toDateString() === excludeDate.toDateString()
  );
}

// Helper function to generate recurring dates
function generateRecurringDates(
  startDate: Date, 
  endDate: Date, 
  days: string[], 
  recurrenceType: string,
  excludeDates: Date[] = []
): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = getDayOfWeek(current);
    
    if (days.includes(dayOfWeek) && !isDateExcluded(current, excludeDates)) {
      dates.push(new Date(current));
    }
    
    // Move to next occurrence based on recurrence type
    switch (recurrenceType) {
      case 'WEEKLY':
        current.setDate(current.getDate() + 1);
        break;
      case 'BIWEEKLY':
        // For biweekly, we need to track weeks
        current.setDate(current.getDate() + 1);
        break;
      case 'MONTHLY':
        current.setDate(current.getDate() + 1);
        break;
      default:
        current.setDate(current.getDate() + 1);
    }
  }
  
  return dates;
}

// POST - Generate timetables from template
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
    const { templateId, regenerate = false } = body;

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Fetch the template
    const template = await prisma.timetableTemplate.findUnique({
      where: { id: parseInt(templateId) },
      include: {
        timetables: true
      }
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.status !== 'ACTIVE') {
      return NextResponse.json({ error: "Template is not active" }, { status: 400 });
    }

    // If regenerate is true, delete existing timetables from this template
    if (regenerate && template.timetables.length > 0) {
      await prisma.timetable.deleteMany({
        where: { templateId: parseInt(templateId) }
      });
    }

    // Check if timetables already exist and regenerate is false
    if (!regenerate && template.timetables.length > 0) {
      return NextResponse.json({
        message: "Timetables already generated for this template",
        count: template.timetables.length
      });
    }

    // Generate dates based on template configuration
    const dates = generateRecurringDates(
      template.startDate,
      template.endDate,
      template.days,
      template.recurrenceType,
      template.excludeDates
    );

    if (dates.length === 0) {
      return NextResponse.json({
        error: "No valid dates found for the specified criteria"
      }, { status: 400 });
    }

    // Check for conflicts with existing timetables
    const conflictingDates: Date[] = [];
    for (const date of dates) {
      const startDateTime = new Date(date);
      startDateTime.setHours(template.startTime.getHours(), template.startTime.getMinutes());
      
      const endDateTime = new Date(date);
      endDateTime.setHours(template.endTime.getHours(), template.endTime.getMinutes());

      const conflicts = await prisma.timetable.findMany({
        where: {
          branchId: template.branchId,
          classId: template.classId,
          fullDate: date,
          status: 'ACTIVE',
          OR: [
            {
              AND: [
                { startTime: { lte: startDateTime } },
                { endTime: { gt: startDateTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endDateTime } },
                { endTime: { gte: endDateTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: startDateTime } },
                { endTime: { lte: endDateTime } }
              ]
            }
          ]
        }
      });

      if (conflicts.length > 0) {
        conflictingDates.push(date);
      }
    }

    if (conflictingDates.length > 0) {
      return NextResponse.json({
        error: "Time conflicts detected",
        conflictingDates: conflictingDates.map(d => d.toISOString().split('T')[0]),
        message: `${conflictingDates.length} dates have scheduling conflicts`
      }, { status: 409 });
    }

    // Create timetable entries
    const timetableEntries = dates.map(date => {
      const startDateTime = new Date(date);
      startDateTime.setHours(template.startTime.getHours(), template.startTime.getMinutes());
      
      const endDateTime = new Date(date);
      endDateTime.setHours(template.endTime.getHours(), template.endTime.getMinutes());

      return {
        branchId: template.branchId,
        classId: template.classId,
        academicYearId: template.academicYearId,
        subjectId: template.subjectId,
        teacherId: template.teacherId,
        fullDate: date,
        day: getDayOfWeek(date) as any,
        startTime: startDateTime,
        endTime: endDateTime,
        roomNumber: template.roomNumber,
        buildingName: template.buildingName,
        status: 'ACTIVE' as any,
        templateId: template.id,
        isRecurring: true
      };
    });

    // Batch create timetables
    const createdTimetables = await prisma.timetable.createMany({
      data: timetableEntries
    });

    // Update template with generation info
    await prisma.timetableTemplate.update({
      where: { id: template.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      message: "Timetables generated successfully",
      templateId: template.id,
      templateName: template.name,
      generatedCount: createdTimetables.count,
      dateRange: {
        start: template.startDate.toISOString().split('T')[0],
        end: template.endDate.toISOString().split('T')[0]
      },
      days: template.days,
      timeSlot: {
        start: template.startTime.toTimeString().slice(0, 5),
        end: template.endTime.toTimeString().slice(0, 5)
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error generating timetables from template:", error);
    return NextResponse.json(
      { error: "Failed to generate timetables from template" },
      { status: 500 }
    );
  }
}

// GET - Preview timetable generation (without creating)
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
    const templateId = url.searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Fetch the template
    const template = await prisma.timetableTemplate.findUnique({
      where: { id: parseInt(templateId) },
      include: {
        branch: { select: { shortName: true } },
        class: { select: { name: true } },
        academicYear: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } }
      }
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Generate preview dates
    const dates = generateRecurringDates(
      template.startDate,
      template.endDate,
      template.days,
      template.recurrenceType,
      template.excludeDates
    );

    // Check for conflicts
    const conflictingDates: Date[] = [];
    for (const date of dates) {
      const startDateTime = new Date(date);
      startDateTime.setHours(template.startTime.getHours(), template.startTime.getMinutes());
      
      const endDateTime = new Date(date);
      endDateTime.setHours(template.endTime.getHours(), template.endTime.getMinutes());

      const conflicts = await prisma.timetable.findMany({
        where: {
          branchId: template.branchId,
          classId: template.classId,
          fullDate: date,
          status: 'ACTIVE',
          OR: [
            {
              AND: [
                { startTime: { lte: startDateTime } },
                { endTime: { gt: startDateTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endDateTime } },
                { endTime: { gte: endDateTime } }
              ]
            }
          ]
        }
      });

      if (conflicts.length > 0) {
        conflictingDates.push(date);
      }
    }

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        branch: template.branch.shortName,
        class: template.class.name,
        academicYear: template.academicYear.name,
        subject: template.subject.name,
        teacher: `${template.teacher.firstName} ${template.teacher.lastName}`,
        days: template.days,
        timeSlot: {
          start: template.startTime.toTimeString().slice(0, 5),
          end: template.endTime.toTimeString().slice(0, 5)
        },
        room: template.roomNumber,
        building: template.buildingName
      },
      preview: {
        totalDates: dates.length,
        validDates: dates.length - conflictingDates.length,
        conflictingDates: conflictingDates.length,
        dateRange: {
          start: template.startDate.toISOString().split('T')[0],
          end: template.endDate.toISOString().split('T')[0]
        },
        sampleDates: dates.slice(0, 10).map(d => d.toISOString().split('T')[0]),
        conflicts: conflictingDates.map(d => d.toISOString().split('T')[0])
      }
    });

  } catch (error) {
    console.error("Error previewing timetable generation:", error);
    return NextResponse.json(
      { error: "Failed to preview timetable generation" },
      { status: 500 }
    );
  }
}
