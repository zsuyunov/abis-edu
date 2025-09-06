import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Filter parameters
  const branchId = searchParams.get("branchId");
  const academicYearId = searchParams.get("academicYearId");
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const teacherId = searchParams.get("teacherId");
  const status = searchParams.get("status");
  const format = searchParams.get("format") || "csv";
  
  // Validate required parameters
  if (!branchId || !academicYearId) {
    return NextResponse.json(
      { error: "Branch ID and Academic Year ID are required" },
      { status: 400 }
    );
  }

  try {
    const where: any = {
      branchId: parseInt(branchId),
      academicYearId: parseInt(academicYearId),
    };
    
    if (classId) where.classId = parseInt(classId);
    if (subjectId) where.subjectId = parseInt(subjectId);
    if (teacherId) where.teacherId = teacherId;
    if (status && status !== "ALL") where.status = status;
    
    const homework = await prisma.homework.findMany({
      where,
      include: {
        submissions: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true,
              }
            },
            attachments: {
              select: {
                fileName: true,
              }
            }
          }
        },
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            teacherId: true,
          }
        },
        subject: { select: { name: true } },
        class: { select: { name: true } },
        branch: { select: { shortName: true } },
        academicYear: { select: { name: true } },
      },
      orderBy: { assignedDate: "desc" },
    });

    if (format === "student") {
      // Student-level export
      const studentData: any[] = [];
      
      homework.forEach(hw => {
        hw.submissions.forEach(submission => {
          studentData.push({
            "Homework ID": hw.id,
            "Homework Title": hw.title,
            "Subject": hw.subject.name,
            "Teacher": `${hw.teacher.firstName} ${hw.teacher.lastName}`,
            "Student ID": submission.student.studentId,
            "Student Name": `${submission.student.firstName} ${submission.student.lastName}`,
            "Assigned Date": hw.assignedDate.toISOString().split('T')[0],
            "Due Date": hw.dueDate.toISOString().split('T')[0],
            "Submission Status": submission.status.replace('_', ' '),
            "Submission Date": submission.submissionDate ? submission.submissionDate.toISOString().split('T')[0] : "",
            "Grade": submission.grade || "",
            "Feedback": submission.feedback || "",
            "File Submitted": submission.attachments && submission.attachments.length > 0 ? "Yes" : "No",
            "File Names": submission.attachments && submission.attachments.length > 0 
              ? submission.attachments.map(a => a.fileName).join("; ") 
              : "",
          });
        });
      });

      const headers = Object.keys(studentData[0] || {});
      const csvContent = [
        headers.join(","),
        ...studentData.map(row => 
          headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(",")
        )
      ].join("\n");

      const fileName = `homework_students_export_${new Date().toISOString().split('T')[0]}.csv`;
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } else {
      // Class-level summary export
      const exportData = homework.map(hw => {
        const totalStudents = hw.submissions.length;
        const submitted = hw.submissions.filter(s => s.status === "SUBMITTED" || s.status === "GRADED").length;
        const late = hw.submissions.filter(s => s.status === "LATE").length;
        const notSubmitted = hw.submissions.filter(s => s.status === "NOT_SUBMITTED").length;
        const graded = hw.submissions.filter(s => s.grade !== null).length;
        
        const grades = hw.submissions
          .filter(s => s.grade !== null)
          .map(s => s.grade!) as number[];
        
        const averageGrade = grades.length > 0 
          ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length * 100) / 100 
          : 0;
        const highestGrade = grades.length > 0 ? Math.max(...grades) : 0;
        const lowestGrade = grades.length > 0 ? Math.min(...grades) : 0;

        return {
          "Homework ID": hw.id,
          "Title": hw.title,
          "Subject": hw.subject.name,
          "Teacher": `${hw.teacher.firstName} ${hw.teacher.lastName} (${hw.teacher.teacherId})`,
          "Class": hw.class.name,
          "Branch": hw.branch.shortName,
          "Academic Year": hw.academicYear.name,
          "Assigned Date": hw.assignedDate.toISOString().split('T')[0],
          "Due Date": hw.dueDate.toISOString().split('T')[0],
          "Status": hw.status,
          "Total Students": totalStudents,
          "Submitted": submitted,
          "Late Submissions": late,
          "Not Submitted": notSubmitted,
          "Graded": graded,
          "Submission Rate (%)": totalStudents > 0 ? Math.round((submitted / totalStudents) * 100) : 0,
          "Late Rate (%)": totalStudents > 0 ? Math.round((late / totalStudents) * 100) : 0,
          "Average Grade": averageGrade,
          "Highest Grade": highestGrade,
          "Lowest Grade": lowestGrade,
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
              academicYearId,
              classId,
              subjectId,
              teacherId,
              status,
            }
          }
        });
      }

      if (exportData.length === 0) {
        return new NextResponse("No data to export", { status: 400 });
      }

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(",")
        )
      ].join("\n");

      const fileName = `homework_summary_export_${new Date().toISOString().split('T')[0]}.csv`;
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }
    
  } catch (error) {
    console.error("Error exporting homework:", error);
    return NextResponse.json(
      { error: "Failed to export homework" },
      { status: 500 }
    );
  }
}
