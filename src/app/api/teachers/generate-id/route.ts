import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Generate a unique teacher ID in format T + 5 digits
    let teacherId: string;
    let counter = 1;
    
    while (true) {
      const randomDigits = Math.floor(Math.random() * 90000) + 10000; // 5 digits
      teacherId = `T${randomDigits}`;
      
      const existingTeacher = await prisma.teacher.findFirst({
        where: { teacherId: teacherId }
      });
      
      if (!existingTeacher) {
        return NextResponse.json({
          success: true,
          teacherId: teacherId
        });
      }
      
      counter++;
      if (counter > 999) {
        return NextResponse.json({
          success: false,
          error: "Could not generate unique teacher ID after 999 attempts"
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error("Error generating teacher ID:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to generate teacher ID"
    }, { status: 500 });
  }
}
