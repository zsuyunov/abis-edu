import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

// GET /api/student-grades - Get student's grades and statistics
export const GET = authenticateJWT(authorizeRole('STUDENT', 'PARENT')(async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const studentId = headersList.get('x-user-id');

    if (!studentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'grades';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const subjectId = searchParams.get('subjectId');

    // Get student's elective subject assignments
    const electiveAssignments = await prisma.electiveStudentAssignment.findMany({
      where: {
        studentId: studentId,
        status: 'ACTIVE'
      },
      include: {
        electiveSubject: {
          include: {
            subject: true
          }
        }
      }
    });

    // Build where clause to include both regular and elective grades
    const whereClause: any = {
      studentId
    };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (subjectId) {
      const subjectIdInt = parseInt(subjectId);
      
      // Find elective subjects that match this subject ID
      const matchingElectiveSubjects = electiveAssignments
        .filter(assignment => assignment.electiveSubject.subjectId === subjectIdInt)
        .map(assignment => assignment.electiveSubjectId);

      // Create OR condition to include both regular and elective grades
      if (matchingElectiveSubjects.length > 0) {
        whereClause.OR = [
          { subjectId: subjectIdInt, electiveSubjectId: null }, // Regular class grades
          { electiveSubjectId: { in: matchingElectiveSubjects } } // Elective grades
        ];
      } else {
        // Only regular grades for this subject
        whereClause.subjectId = subjectIdInt;
      }
    }

    console.log('🔍 Student Grades Query:', {
      studentId,
      view,
      startDate,
      endDate,
      subjectId,
      whereClause
    });

    if (view === 'statistics') {
      // Fetch grade statistics
      const grades = await prisma.grade.findMany({
        where: whereClause,
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          electiveGroup: {
            select: {
              id: true,
              name: true
            }
          },
          electiveSubject: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true
                }
              },
              electiveGroup: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: [
          { date: 'desc' }
        ]
      });

      // Calculate statistics
      const totalGrades = grades.length;
      const averageGrade = totalGrades > 0
        ? grades.reduce((sum, grade) => sum + (grade.value / grade.maxValue) * 100, 0) / totalGrades
        : 0;

      const highestGrade = totalGrades > 0
        ? Math.max(...grades.map(grade => (grade.value / grade.maxValue) * 100))
        : 0;

      const lowestGrade = totalGrades > 0
        ? Math.min(...grades.map(grade => (grade.value / grade.maxValue) * 100))
        : 0;

      // Calculate weekly average (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyGrades = grades.filter(grade => new Date(grade.date) >= weekAgo);
      const weeklyAverage = weeklyGrades.length > 0
        ? weeklyGrades.reduce((sum, grade) => sum + (grade.value / grade.maxValue) * 100, 0) / weeklyGrades.length
        : 0;

      // Subject averages
      const subjectMap = new Map();
      grades.forEach(grade => {
        const isElective = !!grade.electiveSubjectId;
        const subjectInfo = isElective ? grade.electiveSubject?.subject : grade.subject;
        const subjectName = subjectInfo?.name || 'Unknown Subject';
        const percentage = (grade.value / grade.maxValue) * 100;

        if (!subjectMap.has(subjectName)) {
          subjectMap.set(subjectName, { total: 0, count: 0 });
        }

        const subjectData = subjectMap.get(subjectName);
        subjectData.total += percentage;
        subjectData.count += 1;
      });

      const subjectAverages = Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        average: data.total / data.count,
        gradeCount: data.count
      }));

      // Recent grades
      const recentGrades = grades.slice(0, 10).map(grade => {
        const isElective = !!grade.electiveSubjectId;
        const subjectInfo = isElective ? grade.electiveSubject?.subject : grade.subject;
        
        return {
          id: grade.id.toString(),
          value: grade.value,
          maxValue: grade.maxValue,
          subject: subjectInfo?.name || 'Unknown Subject',
          date: grade.date.toISOString(),
          type: grade.type,
          elective: isElective ? {
            groupName: grade.electiveGroup?.name || grade.electiveSubject?.electiveGroup?.name || 'Unknown Group',
            isElective: true
          } : null
        };
      });

      const statistics = {
        weeklyAverage,
        totalGrades,
        averageGrade,
        highestGrade,
        lowestGrade,
        subjectAverages,
        recentGrades
      };

      return NextResponse.json({
        success: true,
        statistics
      });

    } else {
      // Fetch regular grade records
      const grades = await prisma.grade.findMany({
        where: whereClause,
        include: {
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
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          electiveGroup: {
            select: {
              id: true,
              name: true
            }
          },
          electiveSubject: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true
                }
              },
              electiveGroup: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { subject: { name: 'asc' } }
        ]
      });

      console.log(`✅ Found ${grades.length} grades for student`);
      
      // If no grades found, check total count
      if (grades.length === 0) {
        const totalCount = await prisma.grade.count({
          where: { studentId }
        });
        console.log(`📊 Total grades in database for student: ${totalCount}`);
        
        if (totalCount > 0) {
          // Get sample grades to show date range
          const sampleGrades = await prisma.grade.findMany({
            where: { studentId },
            take: 5,
            orderBy: { date: 'desc' },
            select: { date: true, value: true, maxValue: true, subject: { select: { name: true } } }
          });
          console.log('📅 Sample grades:', sampleGrades);
        }
      }

      // Transform data for frontend
      const transformedGrades = grades.map(grade => {
        const isElective = !!grade.electiveSubjectId;
        const subjectInfo = isElective ? grade.electiveSubject?.subject : grade.subject;
        
        return {
          id: grade.id.toString(),
          value: grade.value,
          maxValue: grade.maxValue,
          percentage: (grade.value / grade.maxValue) * 100,
          subjectId: subjectInfo?.id || grade.subjectId,
          subject: {
            id: (subjectInfo?.id || grade.subjectId)?.toString() || '',
            name: subjectInfo?.name || 'Unknown Subject'
          },
          class: grade.class?.name || 'Unknown Class',
          teacher: {
            id: grade.teacher.id,
          firstName: grade.teacher.firstName,
          lastName: grade.teacher.lastName
        },
        date: grade.date.toISOString(),
        type: grade.type,
        description: grade.description,
        elective: isElective ? {
          groupId: grade.electiveGroupId,
          groupName: grade.electiveGroup?.name || grade.electiveSubject?.electiveGroup?.name || 'Unknown Group',
          subjectId: grade.electiveSubjectId,
          isElective: true
        } : null
        };
      });

      return NextResponse.json({
        success: true,
        grades: transformedGrades,
        totalCount: grades.length
      });
    }

  } catch (error) {
    console.error('Error fetching student grades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}));