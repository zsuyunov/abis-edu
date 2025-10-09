import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";

async function postHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { comment, createdBy } = body;
    const academicYearId = parseInt(params.id);

    // Create archive comment
    await prisma.archiveComment.create({
      data: {
        academicYearId,
        comment,
        action: "RESTORE",
        createdBy
      }
    });

    // Restore the academic year
    const academicYear = await prisma.academicYear.update({
      where: { id: academicYearId },
      data: {
        status: "ACTIVE",
        restoredAt: new Date()
      },
      include: {
        semesters: {
          orderBy: { startDate: "asc" }
        }
      }
    });

    return NextResponse.json({ academicYear });
  } catch (error) {
    console.error("Failed to restore academic year:", error);
    return NextResponse.json(
      { error: "Failed to restore academic year" },
      { status: 500 }
    );
  }
}
