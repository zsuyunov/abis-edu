import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  // Verify JWT token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.substring(7);
  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  
  // Filter parameters
  const format = searchParams.get("format") || "pdf"; // pdf or excel
  const type = searchParams.get("type") || "summary"; // summary or detailed
  const dateRange = searchParams.get("dateRange") || "all";
  const status = searchParams.get("status") || "all";
  const branch = searchParams.get("branch") || "all";
  const classParam = searchParams.get("class") || "all";
  const subject = searchParams.get("subject") || "all";
  const customStartDate = searchParams.get("customStartDate");
  const customEndDate = searchParams.get("customEndDate");
  const teacherId = decoded.id;
  
  try {
    // Build date filter
    let dateFilter: any = {};
    if (dateRange === 'last_week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter.assignedDate = { gte: weekAgo };
    } else if (dateRange === 'last_month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter.assignedDate = { gte: monthAgo };
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      dateFilter.assignedDate = {
        gte: new Date(customStartDate),
        lte: new Date(customEndDate)
      };
    }

    // Build where clause
    const where: any = {
      teacherId: teacherId,
      ...dateFilter
    };
    
    if (branch !== 'all') where.branchId = parseInt(branch);
    if (classParam !== 'all') where.classId = parseInt(classParam);
    if (subject !== 'all') where.subjectId = parseInt(subject);
    if (status !== 'all') {
      where.submissions = {
        some: {
          status: status.toUpperCase()
        }
      };
    }
    
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
            }
          }
        },
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        subject: { select: { name: true } },
        class: { select: { name: true } },
        branch: { select: { shortName: true } },
      },
      orderBy: { assignedDate: "desc" },
    });

    if (homework.length === 0) {
      return new NextResponse("No homework data found for export", { status: 400 });
    }

    // Prepare export data based on type
    let exportData: any[] = [];
    
    if (type === 'detailed') {
      // Detailed export - individual student submissions
      homework.forEach(hw => {
        hw.submissions.forEach(submission => {
          exportData.push({
            "Homework ID": hw.id,
            "Title": hw.title,
            "Description": hw.description,
            "Subject": hw.subject.name,
            "Class": hw.class.name,
            "Branch": hw.branch.shortName,
            "Teacher": `${hw.teacher.firstName} ${hw.teacher.lastName}`,
            "Student ID": submission.student.studentId,
            "Student Name": `${submission.student.firstName} ${submission.student.lastName}`,
            "Total Points": hw.totalPoints || 0,
            "Passing Grade": hw.passingGrade || 0,
            "Assigned Date": new Date(hw.assignedDate).toLocaleDateString(),
            "Due Date": new Date(hw.dueDate).toLocaleDateString(),
            "Status": submission.status,
            "Submitted At": submission.submissionDate ? new Date(submission.submissionDate).toLocaleString() : "Not Submitted",
            "Grade": submission.grade || "Not Graded",
            "Feedback": submission.feedback || "No Feedback",
            "Content": submission.content || "No Response"
          });
        });
      });
    } else {
      // Summary export - homework overview
      exportData = homework.map(hw => {
        const totalStudents = hw.submissions.length;
        const submitted = hw.submissions.filter(s => s.status === "SUBMITTED" || s.grade !== null).length;
        const pending = hw.submissions.filter(s => s.status === "NOT_SUBMITTED").length;
        const graded = hw.submissions.filter(s => s.grade !== null).length;
        
        const grades = hw.submissions
          .filter(s => s.grade !== null)
          .map(s => s.grade!) as number[];
        
        const averageGrade = grades.length > 0 
          ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length * 100) / 100 
          : 0;
        const highestGrade = grades.length > 0 ? Math.max(...grades) : 0;
        const lowestGrade = grades.length > 0 ? Math.min(...grades) : 0;
        const passedStudents = grades.filter(g => g >= (hw.passingGrade || 0)).length;

        return {
          "Homework ID": hw.id,
          "Title": hw.title,
          "Subject": hw.subject.name,
          "Class": hw.class.name,
          "Branch": hw.branch.shortName,
          "Teacher": `${hw.teacher.firstName} ${hw.teacher.lastName}`,
          "Total Points": hw.totalPoints || 0,
          "Passing Grade": hw.passingGrade || 0,
          "Assigned Date": new Date(hw.assignedDate).toLocaleDateString(),
          "Due Date": new Date(hw.dueDate).toLocaleDateString(),
          "Total Students": totalStudents,
          "Submitted": submitted,
          "Pending": pending,
          "Graded": graded,
          "Submission Rate (%)": totalStudents > 0 ? Math.round((submitted / totalStudents) * 100) : 0,
          "Grading Rate (%)": totalStudents > 0 ? Math.round((graded / totalStudents) * 100) : 0,
          "Pass Rate (%)": graded > 0 ? Math.round((passedStudents / graded) * 100) : 0,
          "Average Grade": averageGrade,
          "Highest Grade": highestGrade,
          "Lowest Grade": lowestGrade,
        };
      });
    }

    // Generate appropriate response based on format
    if (format === 'excel') {
      // For now, return CSV format with Excel MIME type
      // In production, you would use a library like 'exceljs' to generate actual Excel files
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(",")
        )
      ].join("\n");

      const fileName = `homework_${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } else {
      // PDF format - return JSON data for frontend PDF generation
      // In production, you would use a library like 'puppeteer' or 'jspdf' to generate actual PDFs
      const reportData = {
        title: `Homework ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        generatedAt: new Date().toLocaleString(),
        filters: {
          dateRange,
          status: status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1),
          branch: branch === 'all' ? 'All Branches' : branch,
          class: classParam === 'all' ? 'All Classes' : classParam,
          subject: subject === 'all' ? 'All Subjects' : subject
        },
        data: exportData,
        summary: {
          totalHomework: homework.length,
          totalRecords: exportData.length
        }
      };

      return NextResponse.json(reportData);
    }
    
  } catch (error) {
    console.error("Error exporting homework:", error);
    return NextResponse.json(
      { error: "Failed to export homework" },
      { status: 500 }
    );
  }
}
