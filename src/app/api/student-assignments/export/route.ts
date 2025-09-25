import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const academicYearId = searchParams.get("academicYearId");
    const classId = searchParams.get("classId");

    // Validate required parameters
    if (!branchId || !academicYearId || !classId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Branch, Academic Year, and Class must be selected" 
        },
        { status: 400 }
      );
    }

    // Build student where clause
    const studentWhere: any = {
      classId: parseInt(classId),
      branchId: parseInt(branchId),
    };

    // Build class where clause for academic year filtering
    const classWhere: any = {
      academicYearId: parseInt(academicYearId),
    };

    // Fetch students with relations
    const students = await prisma.student.findMany({
      where: {
        ...studentWhere,
        class: classWhere
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            academicYear: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        branch: {
          select: {
            id: true,
            shortName: true,
            district: true,
          }
        }
      },
      orderBy: { studentId: "asc" },
    });

    if (students.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No students found for the selected criteria" 
        },
        { status: 404 }
      );
    }

    // Prepare data for Excel export
    const excelData = students.map((student, index) => ({
      'No': index + 1,
      'Student ID': student.studentId,
      'Full Name': `${student.firstName} ${student.lastName}`,
      'Phone Number': student.phone,
      'Password': `${student.lastName}_suzuk`, // Default password format
      'Class': student.class?.name || 'N/A',
      'Academic Year': student.class?.academicYear?.name || 'N/A',
      'Branch': student.branch?.shortName || 'N/A',
      'Status': student.status,
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 5 },   // No
      { wch: 12 },  // Student ID
      { wch: 25 },  // Full Name
      { wch: 15 },  // Phone Number
      { wch: 20 },  // Password
      { wch: 30 },  // Class
      { wch: 15 },  // Academic Year
      { wch: 10 },  // Branch
      { wch: 10 },  // Status
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    });

    // Generate filename
    const branchName = students[0]?.branch?.shortName || 'Unknown';
    const className = students[0]?.class?.name || 'Unknown';
    const academicYear = students[0]?.class?.academicYear?.name || 'Unknown';
    const filename = `Students_${branchName}_${academicYear}_${className.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Error exporting student assignments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export student assignments" },
      { status: 500 }
    );
  }
}
