import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as XLSX from 'xlsx';

class AuthService {
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  static verifyToken(token: string): { id: string; user?: any } | null {
    try {
      const session = auth(token);
      return session;
    } catch (error) {
      return null;
    }
  }
}

// GET - Generate Excel template for bulk timetable upload
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create template data with headers and sample rows
    const templateData = [
      {
        branch: "SCI", // Branch short name or full name
        class: "Grade 10A", // Class name
        academicYear: "2024-2025", // Academic year name
        subject: "Physics", // Subject name
        teacher: "John Smith", // Teacher full name (First Last)
        date: "2024-09-06", // Date in YYYY-MM-DD format
        startTime: "09:00", // Start time in HH:MM format (24-hour)
        endTime: "10:00", // End time in HH:MM format (24-hour)
        roomNumber: "204", // Room number
        buildingName: "Science Block", // Building name (optional)
        status: "ACTIVE" // Status: ACTIVE or INACTIVE (optional, defaults to ACTIVE)
      },
      {
        branch: "SCI",
        class: "Grade 10A",
        academicYear: "2024-2025",
        subject: "Chemistry",
        teacher: "Jane Doe",
        date: "2024-09-06",
        startTime: "10:15",
        endTime: "11:15",
        roomNumber: "205",
        buildingName: "Science Block",
        status: "ACTIVE"
      },
      {
        branch: "LIT",
        class: "Grade 9B",
        academicYear: "2024-2025",
        subject: "English Literature",
        teacher: "Alice Johnson",
        date: "2024-09-06",
        startTime: "11:30",
        endTime: "12:30",
        roomNumber: "101",
        buildingName: "Main Building",
        status: "ACTIVE"
      }
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 12 }, // branch
      { wch: 15 }, // class
      { wch: 15 }, // academicYear
      { wch: 20 }, // subject
      { wch: 20 }, // teacher
      { wch: 12 }, // date
      { wch: 10 }, // startTime
      { wch: 10 }, // endTime
      { wch: 12 }, // roomNumber
      { wch: 15 }, // buildingName
      { wch: 10 }  // status
    ];
    worksheet['!cols'] = columnWidths;

    // Add instructions sheet
    const instructionsData = [
      { Field: "branch", Description: "Branch short name (e.g., SCI) or full name", Required: "Yes", Example: "SCI, Science Branch" },
      { Field: "class", Description: "Class name as registered in system", Required: "Yes", Example: "Grade 10A, Class 9B" },
      { Field: "academicYear", Description: "Academic year name", Required: "Yes", Example: "2024-2025, 2023-24" },
      { Field: "subject", Description: "Subject name as registered in system", Required: "Yes", Example: "Physics, Mathematics" },
      { Field: "teacher", Description: "Teacher full name (First Last)", Required: "Yes", Example: "John Smith, Jane Doe" },
      { Field: "date", Description: "Class date in YYYY-MM-DD format", Required: "Yes", Example: "2024-09-06, 2024-12-25" },
      { Field: "startTime", Description: "Start time in HH:MM format (24-hour)", Required: "Yes", Example: "09:00, 14:30" },
      { Field: "endTime", Description: "End time in HH:MM format (24-hour)", Required: "Yes", Example: "10:00, 15:30" },
      { Field: "roomNumber", Description: "Room number or identifier", Required: "Yes", Example: "204, Lab-1, A-101" },
      { Field: "buildingName", Description: "Building name (optional)", Required: "No", Example: "Science Block, Main Building" },
      { Field: "status", Description: "Timetable status (optional, defaults to ACTIVE)", Required: "No", Example: "ACTIVE, INACTIVE" }
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [
      { wch: 15 }, // Field
      { wch: 40 }, // Description
      { wch: 10 }, // Required
      { wch: 25 }  // Example
    ];

    // Add validation rules sheet
    const validationData = [
      { Rule: "Date Range", Description: "Dates must be within the selected academic year range" },
      { Rule: "Time Format", Description: "Use 24-hour format (HH:MM). End time must be after start time" },
      { Rule: "No Conflicts", Description: "No time conflicts allowed for same class on same date" },
      { Rule: "Valid References", Description: "Branch, class, academic year, subject, and teacher must exist in system" },
      { Rule: "Teacher Assignment", Description: "Teacher must be assigned to the specified branch" },
      { Rule: "Class Assignment", Description: "Class must belong to the specified branch and academic year" },
      { Rule: "File Format", Description: "Supported formats: .xlsx, .xls, .csv" },
      { Rule: "Maximum Rows", Description: "Maximum 1000 rows per upload for performance" }
    ];

    const validationSheet = XLSX.utils.json_to_sheet(validationData);
    validationSheet['!cols'] = [
      { wch: 20 }, // Rule
      { wch: 60 }  // Description
    ];

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable Data");
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Field Instructions");
    XLSX.utils.book_append_sheet(workbook, validationSheet, "Validation Rules");

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="timetable-bulk-upload-template-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error("Error generating Excel template:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel template" },
      { status: 500 }
    );
  }
}
