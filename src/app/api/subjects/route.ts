import { NextResponse } from "next/server";
import prisma, { withPrismaRetry } from "@/lib/prisma";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET() {
  try {
    // Fetch real subjects from database
    const subjects = await withPrismaRetry(() => 
      prisma.subject.findMany({
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
      })
    );
    
    const response = NextResponse.json({
      success: true,
      data: subjects
    });
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
}));
