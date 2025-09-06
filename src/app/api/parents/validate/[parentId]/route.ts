import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { parentId: string } }
) {
  try {
    const parent = await prisma.parent.findFirst({
      where: { parentId: params.parentId },
      select: {
        id: true,
        parentId: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found with this ID" }, { status: 404 });
    }

    return NextResponse.json(parent);
  } catch (error) {
    console.error("Error validating parent:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
