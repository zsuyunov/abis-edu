import { PrismaClient } from '@prisma/client';
import prisma, { withPrismaRetry } from '@/lib/prisma';

/**
 * Utility functions to prevent duplicate student assignments across elective systems
 *
 * This module ensures that students cannot be assigned to the same subject
 * in both elective groups and elective classes, maintaining data integrity
 * and preventing scheduling conflicts.
 *
 * Usage:
 * - Import checkStudentSubjectConflict() before assigning students to subjects
 * - The function checks both elective group and elective class assignments
 * - Returns detailed error messages specifying where the conflict exists
 * - Use getConflictErrorMessage() to format user-friendly error messages
 *
 * Example:
 * const conflictResult = await checkStudentSubjectConflict(studentId, subjectId);
 * if (conflictResult.hasConflict) {
 *   const errorMessage = getConflictErrorMessage(conflictResult);
 *   // Show error to user: "This student is already assigned to 'Math' in elective group 'Advanced Math Group'"
 * }
 */

interface ConflictResult {
  hasConflict: boolean;
  conflictDetails?: {
    type: 'elective_group' | 'elective_class';
    name: string;
    subjectName: string;
  };
}

/**
 * Check if a student is already assigned to a subject in either elective system
 */
export async function checkStudentSubjectConflict(
  studentId: string,
  subjectId: number
): Promise<ConflictResult> {
  try {
    // Check if student is assigned to this subject in elective groups
    const electiveGroupAssignment = await withPrismaRetry(() =>
      prisma.electiveStudentAssignment.findFirst({
        where: {
          studentId,
          electiveSubject: {
            subjectId,
            status: 'ACTIVE'
          },
          status: 'ACTIVE'
        },
        include: {
          electiveSubject: {
            include: {
              electiveGroup: {
                select: {
                  name: true
                }
              },
              subject: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    );

    if (electiveGroupAssignment) {
      return {
        hasConflict: true,
        conflictDetails: {
          type: 'elective_group',
          name: electiveGroupAssignment.electiveSubject.electiveGroup.name,
          subjectName: electiveGroupAssignment.electiveSubject.subject.name
        }
      };
    }

    // Check if student is assigned to this subject in elective classes
    const electiveClassAssignment = await withPrismaRetry(() =>
      prisma.electiveClassStudentAssignment.findFirst({
        where: {
          studentId,
          electiveClassSubject: {
            subjectId,
            status: 'ACTIVE'
          },
          status: 'ACTIVE'
        },
        include: {
          electiveClassSubject: {
            include: {
              electiveClass: {
                select: {
                  name: true
                }
              },
              subject: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    );

    if (electiveClassAssignment) {
      return {
        hasConflict: true,
        conflictDetails: {
          type: 'elective_class',
          name: electiveClassAssignment.electiveClassSubject.electiveClass.name,
          subjectName: electiveClassAssignment.electiveClassSubject.subject.name
        }
      };
    }

    return { hasConflict: false };

  } catch (error) {
    console.error('Error checking student subject conflict:', error);
    throw error;
  }
}

/**
 * Get formatted error message for student subject conflict
 */
export function getConflictErrorMessage(conflictResult: ConflictResult): string {
  if (!conflictResult.hasConflict || !conflictResult.conflictDetails) {
    return '';
  }

  const { type, name, subjectName } = conflictResult.conflictDetails;

  if (type === 'elective_group') {
    return `This student is already assigned to "${subjectName}" in elective group "${name}". A student cannot be assigned to the same subject in both elective groups and elective classes.`;
  } else {
    return `This student is already assigned to "${subjectName}" in elective class "${name}". A student cannot be assigned to the same subject in both elective groups and elective classes.`;
  }
}
