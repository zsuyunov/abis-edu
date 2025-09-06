import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      select: { 
        id: true, 
        name: true, 
        status: true 
      },
      where: { 
        status: "ACTIVE" 
      },
      orderBy: { 
        name: "asc" 
      }
    });
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Failed to fetch subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
