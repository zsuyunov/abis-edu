import { NextRequest, NextResponse } from 'next/server';
import type { RouteHandler, AuthenticatedUser, Locals } from './authenticateJWT';
import prisma from '@/lib/prisma';

type OwnershipParams = {
  getContext: (request: NextRequest) => Promise<{
    studentId?: string;
    classId?: number;
    subjectId?: number | null;
    teacherId?: string | null;
  }>;
  requireTeacherMatch?: boolean;
  requireStudentSelf?: boolean;
  allowAdminBypass?: boolean;
};

export function validateOwnership(params: OwnershipParams) {
  const { getContext, requireTeacherMatch = true, requireStudentSelf = true, allowAdminBypass = true } = params;

  return function (handler: RouteHandler): RouteHandler {
    return async function (request: NextRequest, context?: any, locals?: Locals) {
      const user = locals?.user as AuthenticatedUser | undefined;
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      if (allowAdminBypass && user.role === 'ADMIN') {
        return handler(request, context, locals);
      }

      const { studentId, classId, subjectId } = await getContext(request);

      if (user.role === 'TEACHER' && requireTeacherMatch) {
        if (!classId) return NextResponse.json({ error: 'ClassId required' }, { status: 400 });
        const assignment = await prisma.teacherAssignment.findFirst({
          where: {
            teacherId: user.id,
            classId,
            status: 'ACTIVE',
            ...(subjectId ? { subjectId } : {}),
          },
        });
        if (!assignment) {
          return NextResponse.json({ error: 'Unauthorized to modify this record' }, { status: 403 });
        }
      }

      if (user.role === 'STUDENT' && requireStudentSelf) {
        if (!studentId || studentId !== user.id) {
          return NextResponse.json({ error: 'Access to other student data is forbidden' }, { status: 403 });
        }
      }

      if (user.role === 'PARENT') {
        if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });
        const link = await prisma.studentParent.findFirst({
          where: { parentId: user.id, studentId },
        });
        if (!link) {
          return NextResponse.json({ error: 'Access denied to this child data' }, { status: 403 });
        }
      }

      return handler(request, context, locals);
    };
  };
}


