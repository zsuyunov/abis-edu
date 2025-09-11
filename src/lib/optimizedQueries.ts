// Database query optimizations for improved performance
// Compatible with existing schema - TypeScript safe

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Optimized student timetable query
export const getOptimizedStudentTimetables = async (
  studentId: string,
  startDate: string,
  endDate: string,
  branchId: number,
  classId: number,
  limit = 50,
  offset = 0
) => {
  return await prisma.timetable.findMany({
    where: {
      classId: classId,
      branchId: branchId,
      // Use date range filtering for better performance
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      }
    },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      roomNumber: true,
      buildingName: true,
      subject: {
        select: {
          id: true,
          name: true
        }
      },
      topics: {
        select: {
          id: true,
          title: true,
          description: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      // Optimized attendance lookup
      Attendance: {
        where: {
          studentId: studentId,
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate + 'T23:59:59.999Z')
          }
        },
        select: {
          status: true,
          notes: true,
          date: true
        },
        take: 1
      }
    },
    orderBy: [
      { startTime: 'asc' }
    ],
    take: limit,
    skip: offset
  });
};

// Optimized teacher timetable query with role-based filtering
export const getOptimizedTeacherTimetables = async (
  teacherId: string,
  startDate: string,
  endDate: string,
  branchId: string,
  mode: 'teacher' | 'supervisor',
  limit = 50,
  offset = 0
) => {
  const baseWhere = {
    branchId: parseInt(branchId),
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate + 'T23:59:59.999Z')
    }
  };

  if (mode === 'teacher') {
    // Direct teacher assignment
    Object.assign(baseWhere, {
      teacherIds: {
        has: teacherId
      }
    });
  } else {
    // Supervisor mode - get all classes they supervise
    const supervisedClasses = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: teacherId,
        branchId: parseInt(branchId)
      },
      select: { classId: true }
    });

    Object.assign(baseWhere, {
      classId: {
        in: supervisedClasses.map(tc => tc.classId)
      }
    });
  }

  return await prisma.timetable.findMany({
    where: baseWhere,
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      roomNumber: true,
      buildingName: true,
      classId: true,
      subjectId: true,
      class: {
        select: {
          id: true,
          name: true,
          academicYear: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      subject: {
        select: {
          id: true,
          name: true
        }
      },
      branch: {
        select: {
          id: true,
          shortName: true
        }
      },
      topics: {
        select: {
          id: true,
          title: true,
          description: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
    },
    orderBy: [
      { startTime: 'asc' }
    ],
    take: limit,
    skip: offset
  });
};

// Dashboard statistics query - simplified version
export const getDashboardStats = async (branchId?: number) => {
  try {
    const whereClause = branchId ? { branchId } : {};

    const [classCount, subjectCount] = await Promise.all([
      prisma.class.count({ where: whereClause }),
      prisma.subject.count()
    ]);

    return {
      admins: { count: 0, trend: 'up' as const, percentage: 0 },
      teachers: { count: 0, trend: 'up' as const, percentage: 0 },
      students: { count: 0, trend: 'up' as const, percentage: 0 },
      parents: { count: 0, trend: 'up' as const, percentage: 0 },
      classes: classCount,
      subjects: subjectCount,
      events: 0
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      admins: { count: 0, trend: 'up' as const, percentage: 0 },
      teachers: { count: 0, trend: 'up' as const, percentage: 0 },
      students: { count: 0, trend: 'up' as const, percentage: 0 },
      parents: { count: 0, trend: 'up' as const, percentage: 0 },
      classes: 0,
      subjects: 0,
      events: 0
    };
  }
};

// Optimized attendance query with batch processing
export const getOptimizedAttendanceData = async (
  studentId: string,
  startDate: string,
  endDate: string,
  limit = 100,
  offset = 0
) => {
  return await prisma.attendance.findMany({
    where: {
      studentId: studentId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      }
    },
    select: {
      id: true,
      status: true,
      date: true,
      notes: true,
      timetable: {
        select: {
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          class: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      date: 'desc'
    },
    take: limit,
    skip: offset
  });
};

// Optimized grade query with aggregations
export const getOptimizedGradeData = async (
  studentId: string,
  academicYearId?: number,
  subjectId?: string,
  limit = 100,
  offset = 0
) => {
  const whereClause: any = {
    studentId: studentId
  };

  if (academicYearId) {
    whereClause.academicYearId = academicYearId;
  }

  if (subjectId) {
    whereClause.subjectId = subjectId;
  }

  const [grades, averages] = await Promise.all([
    prisma.grade.findMany({
      where: whereClause,
      select: {
        id: true,
        value: true,
        maxValue: true,
        type: true,
        description: true,
        date: true,
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit,
      skip: offset
    }),
    prisma.grade.groupBy({
      by: ['subjectId'],
      where: whereClause,
      _avg: {
        value: true
      },
      _count: {
        id: true
      }
    })
  ]);

  return {
    grades,
    averages: averages.map(avg => ({
      subjectId: avg.subjectId,
      average: avg._avg.value || 0,
      count: avg._count.id
    }))
  };
};

// Database indexing recommendations (to be run as migrations)
export const recommendedIndexes = `
-- Timetable performance indexes
CREATE INDEX IF NOT EXISTS idx_timetable_class_branch_date ON "Timetable"("classId", "branchId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_ids ON "Timetable" USING GIN("teacherIds");
CREATE INDEX IF NOT EXISTS idx_timetable_day_time ON "Timetable"("dayOfWeek", "startTime");

-- Attendance performance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON "Attendance"("studentId", "date");
CREATE INDEX IF NOT EXISTS idx_attendance_timetable_date ON "Attendance"("timetableId", "date");

-- Grade performance indexes
CREATE INDEX IF NOT EXISTS idx_grade_student_subject ON "Grade"("studentId", "subjectId");
CREATE INDEX IF NOT EXISTS idx_grade_student_academic_year ON "Grade"("studentId", "academicYearId");
CREATE INDEX IF NOT EXISTS idx_grade_date ON "Grade"("date");

-- User performance indexes
CREATE INDEX IF NOT EXISTS idx_user_role_branch ON "User"("role", "branchId");
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "User"("createdAt");

-- Teacher assignment indexes
CREATE INDEX IF NOT EXISTS idx_teacher_assignment_teacher_role ON "TeacherAssignment"("teacherId", "role");
CREATE INDEX IF NOT EXISTS idx_teacher_assignment_branch_class ON "TeacherAssignment"("branchId", "classId");

-- Topic and homework indexes
CREATE INDEX IF NOT EXISTS idx_timetable_topic_timetable ON "TimetableTopic"("timetableId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_homework_assigned_date ON "Homework"("assignedDate", "dueDate");
`;

export { prisma };
