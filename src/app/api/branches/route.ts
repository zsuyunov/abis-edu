import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      select: { id: true, shortName: true, legalName: true, district: true },
      where: { status: "ACTIVE" },
      orderBy: { shortName: "asc" },
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}
