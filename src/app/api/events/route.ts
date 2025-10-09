import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      include: {
        participations: {
          include: {
            // Add user details based on participant type  
          }
        },
        _count: {
          select: {
            participations: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      title,
      description,
      startTime,
      endTime,
      targetAudience,
      isAllBranches,
      branchIds,
      classIds,
      userIds,
      studentIds,
      teacherIds,
      parentIds,
      createdBy
    } = body;

    // Create the event
    const event = await prisma.event.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        targetAudience,
        isAllBranches: isAllBranches ?? true,
        branchIds: branchIds || [],
        classIds: classIds || [],
        userIds: userIds || [],
        studentIds: studentIds || [],
        teacherIds: teacherIds || [],
        parentIds: parentIds || [],
        createdBy: createdBy || "system"
      },
    });

    // Create participation entries based on target audience
    await createParticipationEntries(event.id, {
      targetAudience,
      isAllBranches,
      branchIds,
      classIds,
      userIds,
      studentIds,
      teacherIds,
      parentIds
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

async function createParticipationEntries(eventId: number, targeting: any) {
  const participations = [];

  try {
    // Handle different targeting scenarios
    switch (targeting.targetAudience) {
      case "ALL_USERS":
        const allUsers = await prisma.user.findMany({ where: { status: "ACTIVE" } });
        const allStudents = await prisma.student.findMany({ where: { status: "ACTIVE" } });
        const allTeachers = await prisma.teacher.findMany({ where: { status: "ACTIVE" } });
        const allParents = await prisma.parent.findMany({ where: { status: "ACTIVE" } });
        
        participations.push(
          ...allUsers.map((user: any) => ({
            eventId,
            userId: user.id,
            participantType: "USER" as const,
            status: "PENDING" as const
          })),
          ...allStudents.map((student: any) => ({
            eventId,
            studentId: student.id,
            participantType: "STUDENT" as const,
            status: "PENDING" as const
          })),
          ...allTeachers.map((teacher: any) => ({
            eventId,
            teacherId: teacher.id,
            participantType: "TEACHER" as const,
            status: "PENDING" as const
          })),
          ...allParents.map((parent: any) => ({
            eventId,
            parentId: parent.id,
            participantType: "PARENT" as const,
            status: "PENDING" as const
          }))
        );
        break;

      case "ALL_STUDENTS":
        const students = await prisma.student.findMany({ 
          where: { 
            status: "ACTIVE",
            ...(targeting.isAllBranches ? {} : { branchId: { in: targeting.branchIds || [] } })
          } 
        });
        participations.push(
          ...students.map(student => ({
            eventId,
            studentId: student.id,
            participantType: "STUDENT" as const,
            status: "PENDING" as const
          }))
        );
        break;

      case "ALL_TEACHERS":
        const teachers = await prisma.teacher.findMany({ 
          where: { 
            status: "ACTIVE",
            ...(targeting.isAllBranches ? {} : { branchId: { in: targeting.branchIds || [] } })
          } 
        });
        participations.push(
          ...teachers.map(teacher => ({
            eventId,
            teacherId: teacher.id,
            participantType: "TEACHER" as const,
            status: "PENDING" as const
          }))
        );
        break;

      case "ALL_PARENTS":
        const parents = await prisma.parent.findMany({ where: { status: "ACTIVE" } });
        participations.push(
          ...parents.map(parent => ({
            eventId,
            parentId: parent.id,
            participantType: "PARENT" as const,
            status: "PENDING" as const
          }))
        );
        break;

      case "SPECIFIC_BRANCHES":
        if (targeting.branchIds?.length > 0) {
          const branchUsers = await prisma.user.findMany({ 
            where: { status: "ACTIVE", branchId: { in: targeting.branchIds } } 
          });
          const branchStudents = await prisma.student.findMany({ 
            where: { status: "ACTIVE", branchId: { in: targeting.branchIds } } 
          });
          const branchTeachers = await prisma.teacher.findMany({
            where: { 
              status: "ACTIVE", 
              TeacherAssignment: { 
                some: { 
                  branchId: { in: targeting.branchIds } 
                } 
              } 
            }
          });
          
          participations.push(
            ...branchUsers.map(user => ({
              eventId,
              userId: user.id,
              participantType: "USER" as const,
              status: "PENDING" as const
            })),
            ...branchStudents.map(student => ({
              eventId,
              studentId: student.id,
              participantType: "STUDENT" as const,
              status: "PENDING" as const
            })),
            ...branchTeachers.map(teacher => ({
              eventId,
              teacherId: teacher.id,
              participantType: "TEACHER" as const,
              status: "PENDING" as const
            }))
          );
        }
        break;

      case "SPECIFIC_CLASSES":
        if (targeting.classIds?.length > 0) {
          const classStudents = await prisma.student.findMany({ 
            where: { status: "ACTIVE", classId: { in: targeting.classIds } } 
          });
          participations.push(
            ...classStudents.map(student => ({
              eventId,
              studentId: student.id,
              participantType: "STUDENT" as const,
              status: "PENDING" as const
            }))
          );
        }
        break;

      case "SPECIFIC_USERS":
        if (targeting.userIds?.length > 0) {
          participations.push(
            ...targeting.userIds.map((userId: string) => ({
              eventId,
              userId,
              participantType: "USER" as const,
              status: "PENDING" as const
            }))
          );
        }
        if (targeting.studentIds?.length > 0) {
          participations.push(
            ...targeting.studentIds.map((studentId: string) => ({
              eventId,
              studentId,
              participantType: "STUDENT" as const,
              status: "PENDING" as const
            }))
          );
        }
        if (targeting.teacherIds?.length > 0) {
          participations.push(
            ...targeting.teacherIds.map((teacherId: string) => ({
              eventId,
              teacherId,
              participantType: "TEACHER" as const,
              status: "PENDING" as const
            }))
          );
        }
        if (targeting.parentIds?.length > 0) {
          participations.push(
            ...targeting.parentIds.map((parentId: string) => ({
              eventId,
              parentId,
              participantType: "PARENT" as const,
              status: "PENDING" as const
            }))
          );
        }
        break;
    }

    // Create all participation entries
    if (participations.length > 0) {
      await prisma.eventParticipation.createMany({
        data: participations,
        skipDuplicates: true
      });
    }
  } catch (error) {
    console.error("Error creating participation entries:", error);
  }
}
