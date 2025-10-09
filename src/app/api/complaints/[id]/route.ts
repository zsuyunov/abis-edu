import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        student: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            studentId: true,
            phone: true,
            class: { select: { name: true } }
          } 
        },
        parent: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            parentId: true,
            phone: true,
          } 
        },
        teacher: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            teacherId: true,
            phone: true,
          } 
        },
        branch: { select: { shortName: true, address: true } },
        class: { select: { name: true } },
        subject: { select: { name: true } },
        attachments: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
          }
        },
        statusHistory: {
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            comment: true,
            changedBy: true,
            changedByRole: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" }
        },
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(complaint);
  } catch (error) {
    console.error("Error fetching complaint:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaint" },
      { status: 500 }
    );
  }
}

async function putHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const complaint = await prisma.complaint.update({
      where: { id: parseInt(params.id) },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority,
        classId: body.classId || null,
        subjectId: body.subjectId || null,
      },
      include: {
        student: { 
          select: { 
            firstName: true, 
            lastName: true,
            studentId: true
          } 
        },
        parent: { 
          select: { 
            firstName: true, 
            lastName: true,
            parentId: true
          } 
        },
        teacher: { 
          select: { 
            firstName: true, 
            lastName: true,
            teacherId: true
          } 
        },
        branch: { select: { shortName: true } },
        class: { select: { name: true } },
        subject: { select: { name: true } },
      },
    });
    
    return NextResponse.json(complaint);
  } catch (error) {
    console.error("Error updating complaint:", error);
    return NextResponse.json(
      { error: "Failed to update complaint" },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.complaint.delete({
      where: { id: parseInt(params.id) },
    });
    
    return NextResponse.json({ message: "Complaint deleted successfully" });
  } catch (error) {
    console.error("Error deleting complaint:", error);
    return NextResponse.json(
      { error: "Failed to delete complaint" },
      { status: 500 }
    );
  }
}
