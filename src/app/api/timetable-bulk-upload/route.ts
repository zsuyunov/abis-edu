import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import * as XLSX from 'xlsx';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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

interface TimetableRow {
  branch: string;
  class: string;
  academicYear: string;
  subject: string;
  teacher: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName?: string;
  status?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

// Helper function to validate and parse Excel data
async function validateTimetableData(data: any[]): Promise<{
  validRows: TimetableRow[];
  errors: ValidationError[];
}> {
  const validRows: TimetableRow[] = [];
  const errors: ValidationError[] = [];

  // Get reference data for validation
  const [branches, classes, academicYears, subjects, teachers] = await Promise.all([
    prisma.branch.findMany({ where: { status: 'ACTIVE' }, select: { id: true, shortName: true, name: true } }),
    prisma.class.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true, branchId: true, academicYearId: true } }),
    prisma.academicYear.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true, startDate: true, endDate: true } }),
    prisma.subject.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true } }),
    prisma.teacher.findMany({ where: { status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true, branchId: true } })
  ]);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // Excel row number (accounting for header)

    // Required field validation
    const requiredFields = ['branch', 'class', 'academicYear', 'subject', 'teacher', 'date', 'startTime', 'endTime', 'roomNumber'];
    
    for (const field of requiredFields) {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push({
          row: rowNumber,
          field,
          message: `${field} is required`,
          value: row[field]
        });
      }
    }

    if (errors.some(e => e.row === rowNumber)) {
      continue; // Skip further validation if required fields are missing
    }

    // Validate branch
    const branch = branches.find(b => 
      b.shortName.toLowerCase() === row.branch.toString().toLowerCase() ||
      b.name.toLowerCase() === row.branch.toString().toLowerCase()
    );
    if (!branch) {
      errors.push({
        row: rowNumber,
        field: 'branch',
        message: 'Branch not found',
        value: row.branch
      });
      continue;
    }

    // Validate academic year
    const academicYear = academicYears.find(ay => 
      ay.name.toLowerCase() === row.academicYear.toString().toLowerCase()
    );
    if (!academicYear) {
      errors.push({
        row: rowNumber,
        field: 'academicYear',
        message: 'Academic year not found',
        value: row.academicYear
      });
      continue;
    }

    // Validate class
    const classObj = classes.find(c => 
      c.name.toLowerCase() === row.class.toString().toLowerCase() &&
      c.branchId === branch.id &&
      c.academicYearId === academicYear.id
    );
    if (!classObj) {
      errors.push({
        row: rowNumber,
        field: 'class',
        message: 'Class not found in specified branch and academic year',
        value: row.class
      });
      continue;
    }

    // Validate subject
    const subject = subjects.find(s => 
      s.name.toLowerCase() === row.subject.toString().toLowerCase()
    );
    if (!subject) {
      errors.push({
        row: rowNumber,
        field: 'subject',
        message: 'Subject not found',
        value: row.subject
      });
      continue;
    }

    // Validate teacher
    const teacher = teachers.find(t => {
      const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
      const inputName = row.teacher.toString().toLowerCase();
      return fullName === inputName && t.branchId === branch.id;
    });
    if (!teacher) {
      errors.push({
        row: rowNumber,
        field: 'teacher',
        message: 'Teacher not found in specified branch',
        value: row.teacher
      });
      continue;
    }

    // Validate date
    let parsedDate: Date;
    try {
      parsedDate = new Date(row.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date');
      }
      
      // Check if date is within academic year
      if (parsedDate < new Date(academicYear.startDate) || parsedDate > new Date(academicYear.endDate)) {
        errors.push({
          row: rowNumber,
          field: 'date',
          message: 'Date is outside academic year range',
          value: row.date
        });
        continue;
      }
    } catch (error) {
      errors.push({
        row: rowNumber,
        field: 'date',
        message: 'Invalid date format',
        value: row.date
      });
      continue;
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(row.startTime)) {
      errors.push({
        row: rowNumber,
        field: 'startTime',
        message: 'Invalid time format (use HH:MM)',
        value: row.startTime
      });
      continue;
    }
    if (!timeRegex.test(row.endTime)) {
      errors.push({
        row: rowNumber,
        field: 'endTime',
        message: 'Invalid time format (use HH:MM)',
        value: row.endTime
      });
      continue;
    }

    // Validate time logic
    const startTime = new Date(`1970-01-01T${row.startTime}:00`);
    const endTime = new Date(`1970-01-01T${row.endTime}:00`);
    if (startTime >= endTime) {
      errors.push({
        row: rowNumber,
        field: 'endTime',
        message: 'End time must be after start time',
        value: `${row.startTime} - ${row.endTime}`
      });
      continue;
    }

    // Auto-generate day from date
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][parsedDate.getDay()];

    validRows.push({
      branch: branch.shortName,
      class: classObj.name,
      academicYear: academicYear.name,
      subject: subject.name,
      teacher: `${teacher.firstName} ${teacher.lastName}`,
      date: parsedDate.toISOString().split('T')[0],
      day: dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      roomNumber: row.roomNumber.toString(),
      buildingName: row.buildingName?.toString() || null,
      status: row.status?.toString().toUpperCase() || 'ACTIVE'
    });
  }

  return { validRows, errors };
}

// Helper function to check for conflicts
async function checkTimetableConflicts(validRows: TimetableRow[]): Promise<ValidationError[]> {
  const conflicts: ValidationError[] = [];

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    
    // Get the actual database IDs
    const [branch, classObj, academicYear, subject, teacher] = await Promise.all([
      prisma.branch.findFirst({ where: { shortName: row.branch } }),
      prisma.class.findFirst({ 
        where: { 
          name: row.class,
          branch: { shortName: row.branch },
          academicYear: { name: row.academicYear }
        }
      }),
      prisma.academicYear.findFirst({ where: { name: row.academicYear } }),
      prisma.subject.findFirst({ where: { name: row.subject } }),
      prisma.teacher.findFirst({ 
        where: { 
          firstName: row.teacher.split(' ')[0],
          lastName: row.teacher.split(' ').slice(1).join(' ')
        }
      })
    ]);

    if (!branch || !classObj || !academicYear || !subject || !teacher) {
      continue; // Skip if references not found
    }

    const date = new Date(row.date);
    const startDateTime = new Date(date);
    const [startHour, startMinute] = row.startTime.split(':').map(Number);
    startDateTime.setHours(startHour, startMinute);

    const endDateTime = new Date(date);
    const [endHour, endMinute] = row.endTime.split(':').map(Number);
    endDateTime.setHours(endHour, endMinute);

    // Check for conflicts with existing timetables
    const existingConflicts = await prisma.timetable.findMany({
      where: {
        branchId: branch.id,
        classId: classObj.id,
        fullDate: date,
        status: 'ACTIVE',
        OR: [
          {
            AND: [
              { startTime: { lte: startDateTime } },
              { endTime: { gt: startDateTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endDateTime } },
              { endTime: { gte: endDateTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startDateTime } },
              { endTime: { lte: endDateTime } }
            ]
          }
        ]
      },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } }
      }
    });

    if (existingConflicts.length > 0) {
      conflicts.push({
        row: i + 2,
        field: 'time',
        message: `Time conflict with existing timetable: ${existingConflicts[0].subject.name} by ${existingConflicts[0].teacher.firstName} ${existingConflicts[0].teacher.lastName}`,
        value: `${row.startTime} - ${row.endTime}`
      });
    }

    // Check for conflicts within the upload data
    for (let j = i + 1; j < validRows.length; j++) {
      const otherRow = validRows[j];
      if (otherRow.branch === row.branch && 
          otherRow.class === row.class && 
          otherRow.date === row.date) {
        
        const otherStartTime = new Date(`1970-01-01T${otherRow.startTime}:00`);
        const otherEndTime = new Date(`1970-01-01T${otherRow.endTime}:00`);
        const currentStartTime = new Date(`1970-01-01T${row.startTime}:00`);
        const currentEndTime = new Date(`1970-01-01T${row.endTime}:00`);

        if ((currentStartTime < otherEndTime && currentEndTime > otherStartTime)) {
          conflicts.push({
            row: i + 2,
            field: 'time',
            message: `Time conflict with row ${j + 2} in upload data`,
            value: `${row.startTime} - ${row.endTime}`
          });
        }
      }
    }
  }

  return conflicts;
}

// POST - Upload and process bulk timetable file
export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const validateOnly = formData.get('validateOnly') === 'true';

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: "Invalid file type. Please upload Excel (.xlsx, .xls) or CSV file"
      }, { status: 400 });
    }

    // Create upload record
    const uploadRecord = await prisma.timetableBulkUpload.create({
      data: {
        fileName: `${Date.now()}-${file.name}`,
        originalName: file.name,
        uploadedBy: session.id,
        status: 'PROCESSING'
      }
    });

    try {
      // Save file temporarily
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'bulk-timetables');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, uploadRecord.fileName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      // Parse Excel/CSV file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        await prisma.timetableBulkUpload.update({
          where: { id: uploadRecord.id },
          data: {
            status: 'FAILED',
            errors: [{ message: 'File is empty or has no valid data' }],
            completedAt: new Date()
          }
        });
        return NextResponse.json({ error: "File is empty or has no valid data" }, { status: 400 });
      }

      // Update upload record with total rows
      await prisma.timetableBulkUpload.update({
        where: { id: uploadRecord.id },
        data: { totalRows: data.length }
      });

      // Validate data
      const { validRows, errors: validationErrors } = await validateTimetableData(data);
      
      // Check for conflicts
      const conflictErrors = await checkTimetableConflicts(validRows);
      const allErrors = [...validationErrors, ...conflictErrors];

      if (validateOnly) {
        // Return validation results without creating timetables
        await prisma.timetableBulkUpload.update({
          where: { id: uploadRecord.id },
          data: {
            status: allErrors.length > 0 ? 'FAILED' : 'COMPLETED',
            processedRows: data.length,
            successRows: validRows.length,
            errorRows: allErrors.length,
            errors: allErrors,
            completedAt: new Date()
          }
        });

        return NextResponse.json({
          uploadId: uploadRecord.id,
          validation: {
            totalRows: data.length,
            validRows: validRows.length,
            errorRows: allErrors.length,
            errors: allErrors,
            canProceed: allErrors.length === 0
          }
        });
      }

      if (allErrors.length > 0) {
        await prisma.timetableBulkUpload.update({
          where: { id: uploadRecord.id },
          data: {
            status: 'FAILED',
            processedRows: data.length,
            errorRows: allErrors.length,
            errors: allErrors,
            completedAt: new Date()
          }
        });

        return NextResponse.json({
          error: "Validation failed",
          uploadId: uploadRecord.id,
          errors: allErrors
        }, { status: 400 });
      }

      // Create timetable entries
      let successCount = 0;
      const creationErrors: ValidationError[] = [];

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        
        try {
          // Get database IDs
          const [branch, classObj, academicYear, subject, teacher] = await Promise.all([
            prisma.branch.findFirst({ where: { shortName: row.branch } }),
            prisma.class.findFirst({ 
              where: { 
                name: row.class,
                branch: { shortName: row.branch },
                academicYear: { name: row.academicYear }
              }
            }),
            prisma.academicYear.findFirst({ where: { name: row.academicYear } }),
            prisma.subject.findFirst({ where: { name: row.subject } }),
            prisma.teacher.findFirst({ 
              where: { 
                firstName: row.teacher.split(' ')[0],
                lastName: row.teacher.split(' ').slice(1).join(' ')
              }
            })
          ]);

          const date = new Date(row.date);
          const startDateTime = new Date(date);
          const [startHour, startMinute] = row.startTime.split(':').map(Number);
          startDateTime.setHours(startHour, startMinute);

          const endDateTime = new Date(date);
          const [endHour, endMinute] = row.endTime.split(':').map(Number);
          endDateTime.setHours(endHour, endMinute);

          await prisma.timetable.create({
            data: {
              branchId: branch!.id,
              classId: classObj!.id,
              academicYearId: academicYear!.id,
              subjectId: subject!.id,
              teacherId: teacher!.id,
              fullDate: date,
              day: row.day as any,
              startTime: startDateTime,
              endTime: endDateTime,
              roomNumber: row.roomNumber,
              buildingName: row.buildingName,
              status: row.status as any,
              isRecurring: false
            }
          });

          successCount++;
        } catch (error) {
          creationErrors.push({
            row: i + 2,
            field: 'creation',
            message: `Failed to create timetable entry: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      // Update upload record with final results
      await prisma.timetableBulkUpload.update({
        where: { id: uploadRecord.id },
        data: {
          status: creationErrors.length > 0 ? 'FAILED' : 'COMPLETED',
          processedRows: data.length,
          successRows: successCount,
          errorRows: creationErrors.length,
          errors: creationErrors,
          completedAt: new Date()
        }
      });

      return NextResponse.json({
        message: "Bulk upload completed",
        uploadId: uploadRecord.id,
        results: {
          totalRows: data.length,
          successRows: successCount,
          errorRows: creationErrors.length,
          errors: creationErrors
        }
      }, { status: 201 });

    } catch (error) {
      // Update upload record with error
      await prisma.timetableBulkUpload.update({
        where: { id: uploadRecord.id },
        data: {
          status: 'FAILED',
          errors: [{ message: error instanceof Error ? error.message : 'Unknown error occurred' }],
          completedAt: new Date()
        }
      });

      throw error;
    }

  } catch (error) {
    console.error("Error processing bulk timetable upload:", error);
    return NextResponse.json(
      { error: "Failed to process bulk timetable upload" },
      { status: 500 }
    );
  }
}

// GET - Get upload status and history
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

    const url = new URL(request.url);
    const uploadId = url.searchParams.get("uploadId");

    if (uploadId) {
      // Get specific upload details
      const upload = await prisma.timetableBulkUpload.findUnique({
        where: { id: parseInt(uploadId) }
      });

      if (!upload) {
        return NextResponse.json({ error: "Upload not found" }, { status: 404 });
      }

      return NextResponse.json(upload);
    } else {
      // Get upload history
      const uploads = await prisma.timetableBulkUpload.findMany({
        where: { uploadedBy: session.id },
        orderBy: { createdAt: "desc" },
        take: 20
      });

      return NextResponse.json(uploads);
    }

  } catch (error) {
    console.error("Error fetching bulk upload data:", error);
    return NextResponse.json(
      { error: "Failed to fetch bulk upload data" },
      { status: 500 }
    );
  }
}
