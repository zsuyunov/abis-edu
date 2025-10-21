import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    // Get subjects assigned to the class through timetables
    const subjects = await prisma.subject.findMany({
      where: {
        timetables: {
          some: {
            classId: parseInt(classId),
            isActive: true
          }
        },
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
    console.error("Failed to fetch subjects for class:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects for class" },
      { status: 500 }
    );
  }
}));
