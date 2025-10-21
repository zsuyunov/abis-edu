import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('STUDENT', 'PARENT', 'ADMIN')(async function GET(
  request: Request,
  context: { params: { id: string } },
  locals?: { user?: { id: string; role: string } }
) {
  const { params } = context;
  const user = locals?.user;
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ownership validation: Students can only access their own data
    if (user.role === 'STUDENT' && user.id !== params.id) {
      console.warn(`🚨 SECURITY: Student ${user.id} attempted to access student ${params.id}`);
      return NextResponse.json({ error: "Access denied: You can only access your own data" }, { status: 403 });
    }

    // Parents can only access their children's data
    if (user.role === 'PARENT') {
      const studentParent = await prisma.studentParent.findFirst({
        where: {
          parentId: user.id,
          studentId: params.id
        }
      });
      
      if (!studentParent) {
        console.warn(`🚨 SECURITY: Parent ${user.id} attempted to access non-child student ${params.id}`);
        return NextResponse.json({ error: "Access denied: You can only access your children's data" }, { status: 403 });
      }
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        gender: true,
        dateOfBirth: true,
        phone: true,
        status: true,
        classId: true,
        branchId: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            shortName: true,
            legalName: true,
            address: true,
            phone: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            capacity: true
          }
        }
        // SECURITY: password field explicitly excluded
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}));
