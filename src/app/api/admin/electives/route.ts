import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

// TEMPORARILY COMMENTED OUT - ELECTIVE ROUTES CAUSING ISSUES
/*
// GET - Fetch all elective groups with filters
export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const academicYearId = searchParams.get('academicYearId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    let whereClause: any = {};
    
    if (branchId) {
      whereClause.branchId = parseInt(branchId);
    }
    if (academicYearId) {
      whereClause.academicYearId = parseInt(academicYearId);
    }
    if (status) {
      whereClause.status = status;
    } else {
      // By default, exclude archived groups unless explicitly requested
      whereClause.status = {
        in: ['ACTIVE', 'INACTIVE']
      };
    }

    // Fetch elective groups with related data
    const [electiveGroups, totalCount] = await Promise.all([
      prisma.electiveGroup.findMany({
        where: whereClause,
        include: {
          branch: {
            select: {
              id: true,
              shortName: true,
              legalName: true
            }
          },
          academicYear: {
            select: {
              id: true,
              name: true,
              isCurrent: true
            }
          },
          electiveSubjects: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true
                }
              },
              _count: {
                select: {
                  studentAssignments: true
                }
              }
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.electiveGroup.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        electiveGroups,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching elective groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elective groups' },
      { status: 500 }
    );
  }
}));

// POST - Create a new elective group
export const POST = authenticateJWT(authorizeRole('ADMIN')(async function POST(request: NextRequest, _ctx?: any, locals?: { user?: { id: string } }) {
  try {
    const body = await request.json();
    const { name, description, branchId, academicYearId } = body;

    // Validation
    if (!name || !branchId || !academicYearId) {
      return NextResponse.json(
        { error: 'Name, branch, and academic year are required' },
        { status: 400 }
      );
    }

    // Get user ID from locals (set by authentication middleware)
    const userId = locals?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Check if elective group with same name exists for the branch and academic year
    const existingGroup = await prisma.electiveGroup.findUnique({
      where: {
        name_branchId_academicYearId: {
          name,
          branchId: parseInt(branchId),
          academicYearId: parseInt(academicYearId)
        }
      }
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: 'An elective group with this name already exists for the selected branch and academic year' },
        { status: 409 }
      );
    }

    // Create elective group
    const electiveGroup = await prisma.electiveGroup.create({
      data: {
        name,
        description: description || null,
        branchId: parseInt(branchId),
        academicYearId: parseInt(academicYearId),
        createdBy: userId,
        status: 'ACTIVE'
      },
      include: {
        branch: {
          select: {
            id: true,
            shortName: true,
            legalName: true
          }
        },
        academicYear: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: electiveGroup,
      message: 'Elective group created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating elective group:', error);
    return NextResponse.json(
      { error: 'Failed to create elective group' },
      { status: 500 }
    );
  }
}));
*/

// Temporary placeholder endpoints
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: "Elective routes temporarily disabled for maintenance" 
  }, { status: 503 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "Elective routes temporarily disabled for maintenance" 
  }, { status: 503 });
}

