
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status') || 'ACTIVE';

    let whereClause: any = {
      status: status as any
    };

    // If branchId is provided, filter teachers by their assignments to that branch
    if (branchId) {
      whereClause.TeacherAssignment = {
        some: {
          branchId: parseInt(branchId),
          status: 'ACTIVE'
        }
      };
    }

    // Fetch real teachers from database
    const teachers = await prisma.teacher.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        teacherId: true,
        status: true
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" }
      ]
    });

    return NextResponse.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    console.error("Teachers API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch teachers",
      },
      { status: 500 }
    );
  }
}));