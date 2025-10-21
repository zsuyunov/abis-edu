import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

const prisma = new PrismaClient();

// GET - Fetch classes by branch
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const academicYearId = searchParams.get('academicYearId');
    const status = searchParams.get('status') || 'ACTIVE';

    if (!branchId) {
      return NextResponse.json(
        { error: 'Branch ID is required' },
        { status: 400 }
      );
    }

    const whereClause: any = {
      branchId: parseInt(branchId),
      status: status as any,
    };

    if (academicYearId) {
      whereClause.academicYearId = parseInt(academicYearId);
    }

    const classes = await prisma.class.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        capacity: true,
        academicYearId: true,
        branchId: true,
        status: true,
        createdAt: true,
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            shortName: true,
            legalName: true,
          },
        },
        _count: {
          select: {
            students: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    console.error('Error fetching classes by branch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
  return getHandler(request);
}));
