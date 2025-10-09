import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Filter parameters
  const branchId = searchParams.get("branchId");
  const senderType = searchParams.get("senderType");
  const classId = searchParams.get("classId");
  const category = searchParams.get("category");
  
  const priority = searchParams.get("priority");
  const status = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  
  try {
    const where: any = {};
    
    // Apply basic filters
    if (branchId && branchId !== "all") {
      where.branchId = parseInt(branchId);
    }
    if (senderType && senderType !== "ALL") {
      where.senderType = senderType;
    }
    if (classId && classId !== "all") {
      where.classId = parseInt(classId);
    }
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    
    // Apply date filtering
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.createdAt = {
        lte: new Date(endDate),
      };
    }
    
    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        student: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            studentId: true
          } 
        },
        parent: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            parentId: true
          } 
        },
        teacher: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            teacherId: true
          } 
        },
        branch: { select: { shortName: true } },
        class: { select: { name: true } },
        subject: { select: { name: true } },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
          }
        },
        statusHistory: {
          select: {
            fromStatus: true,
            toStatus: true,
            comment: true,
            changedBy: true,
            changedByRole: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" }
        },
      },
      orderBy: [
        { priority: "desc" }, // High priority first
        { createdAt: "desc" },
      ],
    });
    
    return NextResponse.json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaints" },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    const complaint = await prisma.$transaction(async (tx) => {
      // Create the complaint
      const newComplaint = await tx.complaint.create({
        data: {
          title: body.title,
          description: body.description,
          category: body.category,
          priority: body.priority || "MEDIUM",
          status: body.status || "PENDING",
          senderType: body.senderType,
          studentId: body.studentId || null,
          parentId: body.parentId || null,
          teacherId: body.teacherId || null,
          branchId: body.branchId,
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

      // Create initial status history
      await tx.complaintStatusHistory.create({
        data: {
          complaintId: newComplaint.id,
          fromStatus: null,
          toStatus: body.status || "PENDING",
          comment: "Complaint submitted",
          changedBy: body.studentId || body.parentId || body.teacherId || "system",
          changedByRole: body.senderType,
        },
      });

      return newComplaint;
    });
    
    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { error: "Failed to create complaint" },
      { status: 500 }
    );
  }
}
