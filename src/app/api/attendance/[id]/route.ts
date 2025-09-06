import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { error: "Invalid attendance id" },
        { status: 400 }
      );
    }
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        student: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            studentId: true,
            class: { select: { name: true } },
            branch: { select: { shortName: true } }
          } 
        },
        timetable: {
          select: {
            id: true,
            fullDate: true,
            startTime: true,
            endTime: true,
            roomNumber: true,
            buildingName: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
            branch: { select: { shortName: true } },
            academicYear: { select: { name: true } },
            teacher: { 
              select: { 
                firstName: true, 
                lastName: true 
              } 
            },
          }
        },
        archiveComments: {
          select: {
            comment: true,
            action: true,
            createdBy: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" }
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance record" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const attendance = await prisma.attendance.update({
      where: { id: parseInt(params.id) },
      data: {
        studentId: body.studentId,
        timetableId: body.timetableId,
        date: new Date(body.date),
        status: body.status,
        notes: body.notes || null,
        archived: body.archived || false,
      },
      include: {
        student: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            studentId: true
          } 
        },
        timetable: {
          select: {
            id: true,
            fullDate: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
          }
        },
      },
    });
    
    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.attendance.delete({
      where: { id: parseInt(params.id) },
    });
    
    return NextResponse.json({ message: "Attendance record deleted successfully" });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json(
      { error: "Failed to delete attendance record" },
      { status: 500 }
    );
  }
}
