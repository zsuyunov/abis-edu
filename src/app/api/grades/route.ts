import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const teacherId = searchParams.get('teacherId');

    const whereClause: any = {};
    
    if (studentId) whereClause.studentId = studentId;
    if (classId) whereClause.classId = parseInt(classId);
    if (subjectId) whereClause.subjectId = parseInt(subjectId);
    if (teacherId) whereClause.teacherId = teacherId;

    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ grades });
  } catch (error) {
    console.error("Grades API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grades } = body;

    if (!grades || !Array.isArray(grades)) {
      return NextResponse.json(
        { error: "Invalid grades data" },
        { status: 400 }
      );
    }

    // Use transaction to ensure all grades are saved or none
    const result = await prisma.$transaction(async (tx) => {
      const savedGrades = [];
      
      for (const gradeData of grades) {
        const { studentId, value, grade, notes, classId, subjectId, teacherId, timetableId, date, academicYearId, branchId } = gradeData;
        const gradeValue = value || grade;
        
        // Check if grade already exists for this student, subject, and date
        const existingGrade = await tx.grade.findFirst({
          where: {
            studentId,
            subjectId,
            classId,
            date: new Date(date),
          },
        });

        if (existingGrade) {
          // Update existing grade
          const updatedGrade = await tx.grade.update({
            where: { id: existingGrade.id },
            data: {
              value: gradeValue,
              description: notes,
              teacherId,
              timetableId,
            },
          });
          savedGrades.push(updatedGrade);
        } else {
          // Create new grade
          const newGrade = await tx.grade.create({
            data: {
              studentId,
              value: gradeValue,
              description: notes,
              classId,
              subjectId,
              teacherId,
              timetableId,
              date: new Date(date),
              type: 'DAILY', // Default to DAILY grade type
              academicYearId: academicYearId || 1, // Use provided or default
              branchId: branchId || 1, // Use provided or default
              year: new Date(date).getFullYear(),
              month: new Date(date).getMonth() + 1,
            },
          });
          savedGrades.push(newGrade);
        }
      }
      
      return savedGrades;
    });

    return NextResponse.json({ success: true, grades: result });
  } catch (error) {
    console.error("Error saving grades:", error);
    return NextResponse.json(
      { error: "Failed to save grades" },
      { status: 500 }
    );
  }
}