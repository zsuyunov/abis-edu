import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      select: { id: true, shortName: true, legalName: true, district: true },
      where: { status: "ACTIVE" },
      orderBy: { shortName: "asc" },
    });

    const response = NextResponse.json(branches);
    // Ensure no caching for fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}));
