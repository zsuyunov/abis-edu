import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";

async function postHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    const body = await request.json();
    
    const {
      participantId,
      participantType, // USER, STUDENT, TEACHER, PARENT
      status // PARTICIPATING or NOT_PARTICIPATING
    } = body;

    // Validate input
    if (!participantId || !participantType || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build where clause based on participant type
    const whereClause: any = { eventId };
    
    switch (participantType) {
      case "USER":
        whereClause.userId = participantId;
        break;
      case "STUDENT":
        whereClause.studentId = participantId;
        break;
      case "TEACHER":
        whereClause.teacherId = participantId;
        break;
      case "PARENT":
        whereClause.parentId = participantId;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid participant type" },
          { status: 400 }
        );
    }

    // Update participation status
    const participation = await prisma.eventParticipation.updateMany({
      where: whereClause,
      data: {
        status,
        respondedAt: new Date()
      }
    });

    if (participation.count === 0) {
      return NextResponse.json(
        { error: "Participation record not found" },
        { status: 404 }
      );
    }

    // Get updated participation counts
    const participationCounts = await prisma.eventParticipation.groupBy({
      by: ['status'],
      where: { eventId },
      _count: {
        status: true
      }
    });

    const counts = {
      participating: 0,
      notParticipating: 0,
      pending: 0
    };

    participationCounts.forEach((count: any) => {
      switch (count.status) {
        case "PARTICIPATING":
          counts.participating = count._count.status;
          break;
        case "NOT_PARTICIPATING":
          counts.notParticipating = count._count.status;
          break;
        case "PENDING":
          counts.pending = count._count.status;
          break;
      }
    });

    return NextResponse.json({
      message: "Participation updated successfully",
      counts
    });
  } catch (error) {
    console.error("Error updating participation:", error);
    return NextResponse.json(
      { error: "Failed to update participation" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    
    // Get participation counts
    const participationCounts = await prisma.eventParticipation.groupBy({
      by: ['status'],
      where: { eventId },
      _count: {
        status: true
      }
    });

    const counts = {
      participating: 0,
      notParticipating: 0,
      pending: 0
    };

    participationCounts.forEach((count: any) => {
      switch (count.status) {
        case "PARTICIPATING":
          counts.participating = count._count.status;
          break;
        case "NOT_PARTICIPATING":
          counts.notParticipating = count._count.status;
          break;
        case "PENDING":
          counts.pending = count._count.status;
          break;
      }
    });

    return NextResponse.json(counts);
  } catch (error) {
    console.error("Error fetching participation counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch participation counts" },
      { status: 500 }
    );
  }
}
