import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

// POST - Restore an archived elective group
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

    if (existingGroup.status !== 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Only archived elective groups can be restored' },
        { status: 400 }
      );
    }

    // Restore the group
    const restoredGroup = await prisma.electiveGroup.update({
      where: { id: electiveGroupId },
      data: {
        status: 'ACTIVE',
        restoredAt: new Date(),
        archivedAt: null
      }
    });

    return NextResponse.json({
      success: true,
      data: restoredGroup,
      message: 'Elective group restored successfully'
    });

  } catch (error) {
    console.error('Error restoring elective group:', error);
    return NextResponse.json(
      { error: 'Failed to restore elective group' },
      { status: 500 }
    );
  }
}));

