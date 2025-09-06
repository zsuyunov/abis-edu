import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        participations: {
          include: {
            // Add user details based on participant type
          }
        },
        _count: {
          select: {
            participations: {
              where: { status: "PARTICIPATING" }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    const {
      title,
      description,
      startTime,
      endTime,
      targetAudience,
      isAllBranches,
      branchIds,
      classIds,
      userIds,
      studentIds,
      teacherIds,
      parentIds
    } = body;

    // Update the event
    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        targetAudience,
        isAllBranches: isAllBranches ?? true,
        branchIds: branchIds || [],
        classIds: classIds || [],
        userIds: userIds || [],
        studentIds: studentIds || [],
        teacherIds: teacherIds || [],
        parentIds: parentIds || []
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // Delete associated participations first
    await prisma.eventParticipation.deleteMany({
      where: { eventId: id }
    });
    
    // Delete the event
    await prisma.event.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
