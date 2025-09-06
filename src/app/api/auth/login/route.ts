import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json(
        { error: "Phone number and password are required" },
        { status: 400 }
      );
    }

    // Check in all user tables to find the user
    let user = null;
    let userRole = null;

    // Check Admin
    const admin = await prisma.admin.findUnique({ where: { phone } });
    if (admin) {
      user = admin;
      userRole = "admin";
    }

    // Check Teacher
    if (!user) {
      const teacher = await prisma.teacher.findUnique({ where: { phone } });
      if (teacher) {
        user = teacher;
        userRole = "teacher";
      }
    }

    // Check Student
    if (!user) {
      const student = await prisma.student.findUnique({ where: { phone } });
      if (student) {
        user = student;
        userRole = "student";
      }
    }

    // Check Parent
    if (!user) {
      const parent = await prisma.parent.findUnique({ where: { phone } });
      if (parent) {
        user = parent;
        userRole = "parent";
      }
    }

    // Check Main Director (User with MAIN_DIRECTOR position)
    if (!user) {
      const mainDirector = await prisma.user.findUnique({ 
        where: { phone },
        include: { branch: true }
      });
      if (mainDirector && mainDirector.position === "MAIN_DIRECTOR") {
        user = mainDirector;
        userRole = "main_director";
      }
    }

    // Check Support Director (User with SUPPORT_DIRECTOR position)
    if (!user) {
      const supportDirector = await prisma.user.findUnique({
        where: { phone },
        include: { branch: true }
      });
      if (supportDirector && supportDirector.position === "SUPPORT_DIRECTOR") {
        user = supportDirector;
        userRole = "support_director";
      }
    }

    // Check Main HR (User with MAIN_HR position)
    if (!user) {
      const mainHR = await prisma.user.findUnique({
        where: { phone },
        include: { branch: true }
      });
      if (mainHR && mainHR.position === "MAIN_HR") {
        user = mainHR;
        userRole = "main_hr";
      }
    }

    // Check Support HR (User with SUPPORT_HR position)
    if (!user) {
      const supportHR = await prisma.user.findUnique({
        where: { phone },
        include: { branch: true }
      });
      if (supportHR && supportHR.position === "SUPPORT_HR") {
        user = supportHR;
        userRole = "support_hr";
      }
    }

    // Check Main Admission (User with MAIN_ADMISSION position)
    if (!user) {
      const mainAdmission = await prisma.user.findUnique({
        where: { phone },
        include: { branch: true }
      });
      if (mainAdmission && mainAdmission.position === "MAIN_ADMISSION") {
        user = mainAdmission;
        userRole = "main_admission";
      }
    }

    // Check Support Admission (User with SUPPORT_ADMISSION position)
    if (!user) {
      const supportAdmission = await prisma.user.findUnique({
        where: { phone },
        include: { branch: true }
      });
      if (supportAdmission && supportAdmission.position === "SUPPORT_ADMISSION") {
        user = supportAdmission;
        userRole = "support_admission";
      }
    }

    // Check Doctor (User with DOCTOR position)
    if (!user) {
      const doctor = await prisma.user.findUnique({
        where: { phone },
        include: { branch: true }
      });
      if (doctor && doctor.position === "DOCTOR") {
        user = doctor;
        userRole = "doctor";
      }
    }

    // Check Chief (User with CHIEF position)
    if (!user) {
      const chief = await prisma.user.findUnique({
        where: { phone },
        include: { branch: true }
      });
      if (chief && chief.position === "CHIEF") {
        user = chief;
        userRole = "chief";
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await AuthService.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      phone: user.phone,
      role: userRole as 'admin' | 'teacher' | 'student' | 'parent' | 'main_director' | 'support_director' | 'main_hr' | 'support_hr' | 'main_admission' | 'support_admission' | 'doctor' | 'chief',
      name: (user as any).firstName || (user as any).name || 'User',
      surname: (user as any).lastName || (user as any).surname || 'User',
      branchId: (user as any).branchId || (user as any).branch?.id || null
    };

    const token = AuthService.generateToken(tokenPayload);

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        role: userRole,
        name: (user as any).firstName || (user as any).name || 'User',
        surname: (user as any).lastName || (user as any).surname || 'User',
        branchId: (user as any).branchId || (user as any).branch?.id || null
      },
      token
    });

    // Set secure HTTP-only cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
