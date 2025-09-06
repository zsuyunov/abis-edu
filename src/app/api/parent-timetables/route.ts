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
    const view = url.searchParams.get("view") || "weekly"; // weekly, monthly, termly, yearly, multi-child
    const timeFilter = url.searchParams.get("timeFilter") || "current"; // current, past
    
    // Verify that the current user can access this parent's data
    if (session.id !== parentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get parent information with children
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        students: {
          include: {
            class: {
              include: {
                academicYear: true,
                branch: true,
                supervisor: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
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

    if (parent.students.length === 0) {
      return NextResponse.json({ 
        parent: {
          id: parent.id,
          firstName: parent.firstName,
          lastName: parent.lastName,
        },
        children: [],
        timetables: [],
        message: "No children found"
      });
    }

    // Get academic years for filter options
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

    // Handle multi-child view
    if (view === "multi-child") {
      const allTimetables = await Promise.all(
        parent.students.map(async (child) => {
          // Determine academic year for each child
          let targetAcademicYearId;
          if (academicYearId) {
            targetAcademicYearId = parseInt(academicYearId);
          } else if (timeFilter === "current") {
            targetAcademicYearId = availableAcademicYears[0]?.id || child.class.academicYearId;
          } else {
            targetAcademicYearId = availableAcademicYears[0]?.id;
          }

          if (!targetAcademicYearId) return { child, timetables: [] };

          const where: any = {
            classId: child.classId,
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
              },
            },
            orderBy: [
              { fullDate: "asc" },
              { startTime: "asc" },
            ],
          });

          return { child, timetables };
        })
      );

      // Flatten and combine all timetables with child information
      const combinedTimetables = allTimetables.flatMap(({ child, timetables }) =>
        timetables.map(timetable => ({
          ...timetable,
          childInfo: {
            id: child.id,
            firstName: child.firstName,
            lastName: child.lastName,
            studentId: child.studentId,
            class: child.class,
          },
        }))
      );

      return NextResponse.json({
        parent: {
          id: parent.id,
          firstName: parent.firstName,
          lastName: parent.lastName,
        },
        children: parent.students.map(child => ({
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          studentId: child.studentId,
          class: child.class,
          branch: child.branch,
        })),
        timetables: combinedTimetables,
        allChildTimetables: allTimetables,
        availableAcademicYears,
        view,
        timeFilter,
      });
    }

    // Single child view
    let targetChild;
    if (childId) {
      targetChild = parent.students.find(child => child.id === childId);
    } else {
      targetChild = parent.students[0]; // Default to first child
    }

    if (!targetChild) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Determine which academic year to use
    let targetAcademicYearId;
    if (academicYearId) {
      targetAcademicYearId = parseInt(academicYearId);
    } else if (timeFilter === "current") {
      targetAcademicYearId = availableAcademicYears[0]?.id || targetChild.class.academicYearId;
    } else {
      targetAcademicYearId = availableAcademicYears[0]?.id;
    }

    if (!targetAcademicYearId) {
      return NextResponse.json({ 
        parent: {
          id: parent.id,
          firstName: parent.firstName,
          lastName: parent.lastName,
        },
        children: parent.students.map(child => ({
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          studentId: child.studentId,
          class: child.class,
          branch: child.branch,
        })),
        selectedChild: targetChild,
        timetables: [],
        availableAcademicYears,
        message: "No academic year data available"
      });
    }

    // Build filter conditions for timetables
    const where: any = {
      classId: targetChild.classId,
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

    // Get timetables for the selected child's class
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
              in: ["COMPLETED", "IN_PROGRESS"], // Only show completed or in-progress topics to parents
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

    // Get subjects for filter options
    const subjects = await prisma.subject.findMany({
      where: {
        timetables: {
          some: {
            classId: targetChild.classId,
            academicYearId: targetAcademicYearId,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate progress statistics for the selected child
    const progressStats = {
      totalLessons: timetables.length,
      lessonsWithTopics: timetables.filter(t => t.topics.length > 0).length,
      completedTopics: timetables.reduce((sum, t) => 
        sum + t.topics.filter(topic => topic.status === "COMPLETED").length, 0
      ),
      inProgressTopics: timetables.reduce((sum, t) => 
        sum + t.topics.filter(topic => topic.status === "IN_PROGRESS").length, 0
      ),
    };

    // Calculate subject-wise progress
    const subjectProgress = subjects.map(subject => {
      const subjectTimetables = timetables.filter(t => t.subjectId === subject.id);
      const subjectTopics = subjectTimetables.flatMap(t => t.topics);
      const completedTopics = subjectTopics.filter(topic => topic.status === "COMPLETED").length;
      const totalTopics = subjectTopics.length;
      
      return {
        subject: subject.name,
        subjectId: subject.id,
        totalLessons: subjectTimetables.length,
        lessonsWithTopics: subjectTimetables.filter(t => t.topics.length > 0).length,
        totalTopics,
        completedTopics,
        completionRate: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      };
    });

    return NextResponse.json({
      parent: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
      },
      children: parent.students.map(child => ({
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        studentId: child.studentId,
        class: child.class,
        branch: child.branch,
      })),
      selectedChild: {
        id: targetChild.id,
        firstName: targetChild.firstName,
        lastName: targetChild.lastName,
        studentId: targetChild.studentId,
        class: targetChild.class,
        branch: targetChild.branch,
      },
      timetables,
      availableAcademicYears,
      subjects,
      progressStats,
      subjectProgress,
      currentAcademicYear: availableAcademicYears.find(ay => ay.id === targetAcademicYearId),
      view,
      timeFilter,
    });

  } catch (error) {
    console.error("Error fetching parent timetables:", error);
    return NextResponse.json(
      { error: "Failed to fetch parent timetables" },
      { status: 500 }
    );
  }
}
