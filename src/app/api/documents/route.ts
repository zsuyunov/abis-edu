import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Filter parameters
  const branchId = searchParams.get("branchId");
  const audienceType = searchParams.get("audienceType");
  const classId = searchParams.get("classId");
  const academicYearId = searchParams.get("academicYearId");
  const documentType = searchParams.get("documentType");
  const status = searchParams.get("status");
  const searchKeyword = searchParams.get("searchKeyword");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  
  try {
    const where: any = {};
    
    // Apply basic filters
    if (branchId && branchId !== "all") {
      where.branchId = parseInt(branchId);
    }
    if (audienceType && audienceType !== "ALL") {
      where.audienceType = audienceType;
    }
    if (classId && classId !== "all") {
      where.classId = parseInt(classId);
    }
    if (academicYearId && academicYearId !== "all") {
      where.academicYearId = parseInt(academicYearId);
    }
    if (documentType && documentType !== "ALL") {
      where.documentType = documentType;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    
    // Apply search keyword filtering
    if (searchKeyword) {
      where.OR = [
        { title: { contains: searchKeyword, mode: "insensitive" } },
        { description: { contains: searchKeyword, mode: "insensitive" } },
        { tags: { hasSome: [searchKeyword] } },
        { keywords: { hasSome: [searchKeyword] } },
      ];
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
    
    const documents = await prisma.document.findMany({
      where,
      include: {
        assignments: {
          include: {
            student: { 
              select: { 
                id: true, 
                firstName: true, 
                lastName: true,
                studentId: true
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
          }
        },
        downloads: {
          select: {
            id: true,
            downloadedBy: true,
            userType: true,
            downloadedAt: true,
          },
          orderBy: { downloadedAt: "desc" },
          take: 10, // Latest 10 downloads
        },
        versions: {
          select: {
            id: true,
            versionNumber: true,
            fileName: true,
            changeLog: true,
            createdBy: true,
            createdAt: true,
          },
          orderBy: { versionNumber: "desc" }
        },
        branch: { select: { shortName: true } },
        class: { select: { name: true } },
        academicYear: { select: { name: true } },
        archiveComments: {
          select: {
            comment: true,
            action: true,
            createdBy: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5, // Latest 5 archive comments
        },
      },
      orderBy: [
        { status: "asc" }, // Active first
        { createdAt: "desc" },
      ],
    });
    
    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    const document = await prisma.$transaction(async (tx) => {
      // Create the document
      const newDocument = await tx.document.create({
        data: {
          title: body.title,
          description: body.description || null,
          documentType: body.documentType,
          status: body.status || "ACTIVE",
          fileName: body.fileName || "",
          filePath: body.filePath || "",
          fileType: body.fileType || "",
          fileSize: body.fileSize || 0,
          audienceType: body.audienceType,
          branchId: body.branchId || null,
          classId: body.classId || null,
          academicYearId: body.academicYearId || null,
          tags: body.tags || [],
          keywords: body.keywords || [],
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
          createdBy: body.createdBy || "admin",
        },
        include: {
          branch: { select: { shortName: true } },
          class: { select: { name: true } },
          academicYear: { select: { name: true } },
        },
      });

      // Create assignments based on audience type
      if (body.audienceType === "TEACHERS" && body.teacherIds) {
        await Promise.all(
          body.teacherIds.map((teacherId: string) =>
            tx.documentAssignment.create({
              data: {
                documentId: newDocument.id,
                teacherId: teacherId,
              },
            })
          )
        );
      }

      if (body.audienceType === "STUDENTS") {
        if (body.assignToEntireClass && body.classId) {
          // Get all students in the class
          const students = await tx.student.findMany({
            where: { classId: body.classId, status: "ACTIVE" },
            select: { id: true },
          });

          await Promise.all(
            students.map(student =>
              tx.documentAssignment.create({
                data: {
                  documentId: newDocument.id,
                  studentId: student.id,
                },
              })
            )
          );
        } else if (body.studentIds) {
          await Promise.all(
            body.studentIds.map((studentId: string) =>
              tx.documentAssignment.create({
                data: {
                  documentId: newDocument.id,
                  studentId: studentId,
                },
              })
            )
          );
        }
      }

      // Create initial version
      await tx.documentVersion.create({
        data: {
          documentId: newDocument.id,
          versionNumber: 1,
          fileName: body.fileName || "",
          filePath: body.filePath || "",
          fileType: body.fileType || "",
          fileSize: body.fileSize || 0,
          changeLog: "Initial version",
          createdBy: body.createdBy || "admin",
        },
      });

      return newDocument;
    });
    
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
