import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    // Build the where clause
    const where: any = {
      status: "ACTIVE"
    };

    // For now, return all subjects since they are global
    // In the future, if subjects become branch-specific, we can implement filtering here
    // The filtering will be handled on the frontend based on the selected branch

    // Fetch subjects
    const subjects = await prisma.subject.findMany({
      where,
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
    console.error("Failed to fetch subjects by branch:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects by branch" },
      { status: 500 }
    );
  }
}));
