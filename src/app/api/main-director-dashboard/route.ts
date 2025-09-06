import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const currentUserId = headersList.get("x-user-id");

    // Check if user is main director
    if (role !== "main_director") {
      return NextResponse.json(
        { error: "Unauthorized - Main Director access required" },
        { status: 403 }
      );
    }

    // Get comprehensive dashboard statistics
    const [
      adminCount,
      teacherCount,
      studentCount,
      parentCount,
      classCount,
      subjectCount,
      branchCount,
      upcomingEvents,
      recentAnnouncements,
      unreadMessages,
      attendanceToday,
      activeHomework,
      scheduledExams
    ] = await Promise.all([
      prisma.admin.count(),
      prisma.teacher.count({ where: { status: "ACTIVE" } }),
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.parent.count({ where: { status: "ACTIVE" } }),
      prisma.class.count({ where: { status: "ACTIVE" } }),
      prisma.subject.count({ where: { status: "ACTIVE" } }),
      prisma.branch.count({ where: { status: "ACTIVE" } }),
      prisma.event.count({
        where: {
          startTime: {
            gte: new Date()
          }
        }
      }),
      prisma.announcement.count({
        where: {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.message.count({
        where: {
          receiverId: currentUserId,
          readAt: null
        }
      }),
      prisma.attendance.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          },
          status: "PRESENT"
        }
      }),
      prisma.homework.count({
        where: {
          status: "ACTIVE",
          dueDate: {
            gte: new Date()
          }
        }
      }),
      prisma.exam.count({
        where: {
          status: "SCHEDULED",
          date: {
            gte: new Date()
          }
        }
      })
    ]);

    // Calculate trends (simplified - in real app you'd compare with previous periods)
    const stats = {
      admins: {
        count: adminCount,
        trend: "up",
        percentage: 2.1
      },
      teachers: {
        count: teacherCount,
        trend: "up", 
        percentage: 5.3
      },
      students: {
        count: studentCount,
        trend: "up",
        percentage: 8.7
      },
      parents: {
        count: parentCount,
        trend: "up",
        percentage: 7.2
      },
      classes: classCount,
      subjects: subjectCount,
      branches: branchCount,
      events: upcomingEvents,
      announcements: recentAnnouncements,
      unreadMessages: unreadMessages,
      attendanceToday: attendanceToday,
      activeHomework: activeHomework,
      scheduledExams: scheduledExams
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Main Director dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
