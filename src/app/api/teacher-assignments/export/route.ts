import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { headers } from "next/headers";

// Export assigned teachers for a selected branch
// Fields: No, Teacher ID, Full Name, Phone Number, Login Password (firstname_abis)
export async function GET(request: NextRequest) {
  try {
    // Admin auth (reuse header convention used elsewhere)
    const headersList = headers();
    const userId = headersList.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({ where: { id: userId }, select: { id: true } });
    if (!admin) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    if (!branchId) {
      return NextResponse.json({ success: false, error: "branchId is required" }, { status: 400 });
    }

    // Fetch active assignments for the branch, include teacher + branch
    const assignments = await prisma.teacherAssignment.findMany({
      where: { branchId: parseInt(branchId), status: "ACTIVE" },
      include: {
        Teacher: {
          select: {
            id: true,
            teacherId: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        Branch: { select: { id: true, shortName: true } },
      },
      orderBy: { teacherId: "asc" },
    });

    if (assignments.length === 0) {
      return NextResponse.json({ success: false, error: "No assigned teachers found" }, { status: 404 });
    }

    // Unique teachers by id
    const seen = new Set<string>();
    const uniqueTeachers = assignments
      .map((a) => ({ teacher: a.Teacher, branch: a.Branch }))
      .filter((t) => {
        if (!t.teacher) return false;
        if (seen.has(t.teacher.id)) return false;
        seen.add(t.teacher.id);
        return true;
      });

    const excelData = uniqueTeachers.map((t, index) => {
      const firstName = (t.teacher.firstName || "").split(" ")[0].toLowerCase();
      const loginPassword = `${firstName}_abis`;
      return {
        No: index + 1,
        "Teacher ID": t.teacher.teacherId,
        "Full Name": `${t.teacher.firstName} ${t.teacher.lastName}`.trim(),
        "Phone Number": t.teacher.phone,
        "Login Password": loginPassword,
        Branch: t.branch?.shortName || "N/A",
      } as const;
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 14 },
      { wch: 26 },
      { wch: 16 },
      { wch: 18 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const branchName = assignments[0]?.Branch?.shortName || "Branch";
    const filename = `Teachers_${branchName}_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error exporting teacher assignments:", error);
    return NextResponse.json({ success: false, error: "Failed to export teachers" }, { status: 500 });
  }
}


