import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch real subjects from database
    const subjects = await prisma.subject.findMany({
      where: {
        status: "ACTIVE"
      },
      select: {
        id: true,
        name: true,
        status: true
      },
      orderBy: {
        name: "asc"
      }
    });
    
    const response = NextResponse.json(subjects);
    // Ensure no caching for fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Failed to fetch subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
