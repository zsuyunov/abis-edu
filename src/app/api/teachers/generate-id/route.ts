import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
  try {
    // Generate a unique teacher ID in format T + 5 digits
    let teacherId: string;
    let counter = 1;
    const usedIds = new Set<string>();
    
    while (true) {
      // Use timestamp and random to ensure different IDs each time
      const timestamp = Date.now().toString().slice(-3); // Last 3 digits of timestamp
      const random = Math.floor(Math.random() * 100); // 2 random digits
      const randomDigits = parseInt(timestamp + random.toString().padStart(2, '0')).toString().padStart(5, '0').slice(-5);
      teacherId = `T${randomDigits}`;
      
      // Check if we've already tried this ID in this session
      if (usedIds.has(teacherId)) {
        counter++;
        if (counter > 999) {
          return NextResponse.json({
            success: false,
            error: "Could not generate unique teacher ID after 999 attempts"
          }, { status: 500 });
        }
        continue;
      }
      
      usedIds.add(teacherId);
      
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
}));
