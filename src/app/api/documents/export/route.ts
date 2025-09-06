import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Filter parameters (same as documents route)
  const branchId = searchParams.get("branchId");
  const audienceType = searchParams.get("audienceType");
  const classId = searchParams.get("classId");
  const academicYearId = searchParams.get("academicYearId");
  const documentType = searchParams.get("documentType");
  const status = searchParams.get("status");
  const searchKeyword = searchParams.get("searchKeyword");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const format = searchParams.get("format") || "csv"; // csv or json
  
  try {
    const where: any = {};
    
    // Apply filters (same logic as documents route)
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
    
    if (searchKeyword) {
      where.OR = [
        { title: { contains: searchKeyword, mode: "insensitive" } },
        { description: { contains: searchKeyword, mode: "insensitive" } },
        { tags: { has: searchKeyword } },
        { keywords: { has: searchKeyword } },
      ];
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }
    
    const documents = await prisma.document.findMany({
      where,
      include: {
        assignments: {
          include: {
            student: { 
              select: { 
                firstName: true, 
                lastName: true,
                studentId: true
              } 
            },
            teacher: { 
              select: { 
                firstName: true, 
                lastName: true,
                teacherId: true
              } 
            },
          }
        },
        downloads: {
          select: {
            downloadedBy: true,
            userType: true,
            downloadedAt: true,
          }
        },
        versions: {
          select: {
            versionNumber: true,
            createdAt: true,
          }
        },
        branch: { select: { shortName: true } },
        class: { select: { name: true } },
        academicYear: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform data for export
    const exportData = documents.map(doc => {
      const assignedUsers = doc.assignments.map(assignment => {
        if (assignment.student) {
          return `${assignment.student.firstName} ${assignment.student.lastName} (${assignment.student.studentId})`;
        }
        if (assignment.teacher) {
          return `${assignment.teacher.firstName} ${assignment.teacher.lastName} (${assignment.teacher.teacherId})`;
        }
        return "";
      }).join("; ");

      return {
        ID: doc.id,
        Title: doc.title,
        Description: doc.description || "",
        Type: doc.documentType.replace(/_/g, ' '),
        Status: doc.status,
        "Audience Type": doc.audienceType,
        Branch: doc.branch?.shortName || "All Branches",
        Class: doc.class?.name || "",
        "Academic Year": doc.academicYear?.name || "",
        "File Name": doc.fileName,
        "File Type": doc.fileType,
        "File Size (MB)": Math.round((doc.fileSize / (1024 * 1024)) * 100) / 100,
        Tags: doc.tags.join(", "),
        Keywords: doc.keywords.join(", "),
        "Assigned To": assignedUsers,
        "Download Count": doc.downloads.length,
        "Version Count": doc.versions.length,
        "Created By": doc.createdBy,
        "Created Date": doc.createdAt.toISOString().split('T')[0],
        "Expiry Date": doc.expiryDate ? doc.expiryDate.toISOString().split('T')[0] : "",
        "Archived Date": doc.archivedAt ? doc.archivedAt.toISOString().split('T')[0] : "",
      };
    });

    if (format === "json") {
      return NextResponse.json({
        data: exportData,
        metadata: {
          exportDate: new Date().toISOString(),
          totalRecords: exportData.length,
          filters: {
            branchId,
            audienceType,
            classId,
            documentType,
            status,
            startDate,
            endDate,
          }
        }
      });
    }

    // CSV format
    if (exportData.length === 0) {
      return new NextResponse("No data to export", { status: 400 });
    }

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(","),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(",")
      )
    ].join("\n");

    const fileName = `documents_export_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
    
  } catch (error) {
    console.error("Error exporting documents:", error);
    return NextResponse.json(
      { error: "Failed to export documents" },
      { status: 500 }
    );
  }
}
