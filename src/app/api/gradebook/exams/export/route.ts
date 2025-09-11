import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const branchId = searchParams.get("branchId");
  const academicYearId = searchParams.get("academicYearId");
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const format = searchParams.get("format") || "csv";
  const type = searchParams.get("type") || "summary"; // summary or detailed

  try {
    if (!classId || !subjectId) {
      return NextResponse.json(
        { error: "Class and Subject are required" },
        { status: 400 }
      );
    }

    const whereClause: any = {
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      status: { not: "CANCELLED" },
    };
    
    if (branchId && branchId !== "all") {
      whereClause.branchId = parseInt(branchId);
    }
    if (academicYearId && academicYearId !== "all") {
      whereClause.academicYearId = parseInt(academicYearId);
    }
    
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get exams with full details
    const exams = await prisma.exam.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            teacherId: true,
          },
        },
        subject: { select: { name: true } },
        class: { select: { name: true } },
        branch: { select: { shortName: true } },
        academicYear: { select: { name: true } },
        examResults: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { startTime: "asc" },
      ],
    });

    if (format === "csv") {
      let csvContent = "";
      
      if (type === "summary") {
        // Class-level summary report
        csvContent = "Exam Name,Date,Teacher,Room,Full Marks,Passing Marks,Total Students,Average Score,Highest Score,Lowest Score,Pass Count,Fail Count,Pass %,Fail %\n";
        
        exams.forEach(exam => {
          const results = exam.examResults;
          const validResults = results.filter(r => r.marksObtained > 0);
          const totalMarks = validResults.reduce((sum, r) => sum + r.marksObtained, 0);
          const averageScore = validResults.length > 0 ? Math.round((totalMarks / validResults.length) * 100) / 100 : 0;
          
          const passCount = results.filter(r => r.status === "PASS").length;
          const failCount = results.filter(r => r.status === "FAIL").length;
          const totalSubmissions = passCount + failCount;
          
          const passPercentage = totalSubmissions > 0 ? Math.round((passCount / totalSubmissions) * 100) : 0;
          const failPercentage = totalSubmissions > 0 ? Math.round((failCount / totalSubmissions) * 100) : 0;
          
          const marks = validResults.map(r => r.marksObtained);
          const highestScore = marks.length > 0 ? Math.max(...marks) : 0;
          const lowestScore = marks.length > 0 ? Math.min(...marks) : 0;
          
          csvContent += [
            `"${exam.name}"`,
            `"${new Date(exam.date).toLocaleDateString()}"`,
            `"${exam.teacher?.firstName || 'N/A'} ${exam.teacher?.lastName || 'N/A'}"`,
            `"${exam.roomNumber}"`,
            exam.fullMarks,
            exam.passingMarks,
            results.length,
            averageScore,
            highestScore,
            lowestScore,
            passCount,
            failCount,
            passPercentage,
            failPercentage
          ].join(",") + "\n";
        });
      } else {
        // Student-level detailed report
        csvContent = "Exam Name,Date,Student ID,Student Name,Marks Obtained,Full Marks,Percentage,Status,Teacher,Room\n";
        
        exams.forEach(exam => {
          exam.examResults.forEach(result => {
            const percentage = Math.round((result.marksObtained / exam.fullMarks) * 100);
            
            csvContent += [
              `"${exam.name}"`,
              `"${new Date(exam.date).toLocaleDateString()}"`,
              `"${result.student.studentId}"`,
              `"${result.student.firstName} ${result.student.lastName}"`,
              result.marksObtained,
              exam.fullMarks,
              percentage,
              `"${result.status}"`,
              `"${exam.teacher?.firstName || 'N/A'} ${exam.teacher?.lastName || 'N/A'}"`,
              `"${exam.roomNumber}"`
            ].join(",") + "\n";
          });
        });
      }

      const headers = new Headers();
      headers.set("Content-Type", "text/csv");
      headers.set("Content-Disposition", `attachment; filename="exam-report-${type}-${new Date().toISOString().split('T')[0]}.csv"`);
      
      return new Response(csvContent, { headers });
    }

    // Default JSON response for other formats
    return NextResponse.json({ 
      exams: exams.map(exam => ({
        ...exam,
        statistics: {
          totalStudents: exam.examResults.length,
          averageScore: exam.examResults.length > 0 ? 
            Math.round(exam.examResults.reduce((sum, r) => sum + r.marksObtained, 0) / exam.examResults.length * 100) / 100 : 0,
          passCount: exam.examResults.filter(r => r.status === "PASS").length,
          failCount: exam.examResults.filter(r => r.status === "FAIL").length,
        }
      }))
    });
  } catch (error) {
    console.error("Error exporting exam data:", error);
    return NextResponse.json(
      { error: "Failed to export exam data" },
      { status: 500 }
    );
  }
}
