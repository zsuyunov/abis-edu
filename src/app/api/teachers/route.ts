import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Fetch real teachers from database
    const teachers = await prisma.teacher.findMany({
      where: {
        status: "ACTIVE"
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        teacherId: true,
        status: true
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" }
      ]
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Teachers API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch teachers",
      },
      { status: 500 }
    );
  }
}