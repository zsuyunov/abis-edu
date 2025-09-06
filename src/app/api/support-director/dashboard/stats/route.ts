import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const branchIdHeader = headersList.get("x-branch-id");
    
    if (role !== "support_director") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const branchId = Number(branchIdHeader);
    if (!branchId) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 400 });
    }

    // Get current date for today's statistics
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      totalSubjects,
      todayAttendance,
      pendingHomework,
      upcomingExams,
      recentMessages,
      pendingComplaints,
      resolvedComplaints
    ] = await Promise.all([
      // Total students in branch
      prisma.student.count({
        where: { branchId, archivedAt: null }
      }),
      
      // Total teachers in branch
      prisma.teacher.count({
        where: { branchId, archivedAt: null }
      }),
      
      // Total parents (count unique parents of students in this branch)
      prisma.parent.count({
        where: {
          students: {
            some: { branchId }
          },
          archivedAt: null
        }
      }),
      
      // Total classes in branch
      prisma.class.count({
        where: { branchId, archivedAt: null }
      }),
      
      // Total subjects (count subjects taught by teachers in this branch)
      prisma.subject.count({
        where: {
          teachers: {
            some: { branchId }
          },
          archivedAt: null
        }
      }),
      
      // Today's attendance statistics
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          branchId,
          date: {
            gte: todayStart,
            lt: todayEnd
          }
        },
        _count: {
          id: true
        }
      }),
      
      // Pending homework (active homework that's not expired)
      prisma.homework.count({
        where: {
          branchId,
          status: 'ACTIVE',
          dueDate: { gte: today },
          archivedAt: null
        }
      }),
      
      // Upcoming exams (next 7 days)
      prisma.exam.count({
        where: {
          branchId,
          status: 'SCHEDULED',
          date: {
            gte: today,
            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          },
          archivedAt: null
        }
      }),
      
      // Recent unread messages
      prisma.message.count({
        where: {
          branchId,
          readAt: null,
          createdAt: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      
      // Pending complaints
      prisma.complaint.count({
        where: {
          branchId,
          status: 'PENDING'
        }
      }),
      
      // Resolved complaints (last 30 days)
      prisma.complaint.count({
        where: {
          branchId,
          status: 'RESOLVED',
          resolvedAt: {
            gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Process attendance data
    const attendanceStats = {
      present: 0,
      absent: 0,
      late: 0
    };

    todayAttendance.forEach(group => {
      if (group.status === 'PRESENT') attendanceStats.present = group._count.id;
      else if (group.status === 'ABSENT') attendanceStats.absent = group._count.id;
      else if (group.status === 'LATE') attendanceStats.late = group._count.id;
    });

    const stats = {
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      totalSubjects,
      todayAttendance: attendanceStats,
      pendingHomework,
      upcomingExams,
      recentMessages,
      complaints: {
        pending: pendingComplaints,
        resolved: resolvedComplaints
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Support Director dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
