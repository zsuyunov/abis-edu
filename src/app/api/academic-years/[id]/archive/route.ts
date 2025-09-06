import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
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
        action: "ARCHIVE",
        createdBy
      }
    });

    // Archive the academic year
    const academicYear = await prisma.academicYear.update({
      where: { id: academicYearId },
      data: {
        status: "INACTIVE",
        isCurrent: false,
        archivedAt: new Date()
      },
      include: {
        semesters: {
          orderBy: { startDate: "asc" }
        }
      }
    });

    return NextResponse.json({ academicYear });
  } catch (error) {
    console.error("Failed to archive academic year:", error);
    return NextResponse.json(
      { error: "Failed to archive academic year" },
      { status: 500 }
    );
  }
}
