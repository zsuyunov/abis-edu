import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

// POST - Archive an elective group
export const POST = authenticateJWT(authorizeRole('ADMIN')(async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electiveGroupId = parseInt(params.id);

    // Check if elective group exists
    const existingGroup = await prisma.electiveGroup.findUnique({
      where: { id: electiveGroupId }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Elective group not found' },
        { status: 404 }
      );
    }

    if (existingGroup.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Elective group is already archived' },
        { status: 400 }
      );
    }

    // Archive the group
    const archivedGroup = await prisma.electiveGroup.update({
      where: { id: electiveGroupId },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        restoredAt: null
      }
    });

    return NextResponse.json({
      success: true,
      data: archivedGroup,
      message: 'Elective group archived successfully'
    });

  } catch (error) {
    console.error('Error archiving elective group:', error);
    return NextResponse.json(
      { error: 'Failed to archive elective group' },
      { status: 500 }
    );
  }
}));

