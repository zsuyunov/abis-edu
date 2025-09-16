import { NextRequest, NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/admin-direct", "/logout", "/force-logout", "/test-panels", "/session-debug"];

// Define API routes that should be allowed through
const apiRoutes = ["/api/auth/login", "/api/auth/me", "/api/auth/logout"];

// Define role-based route mappings
const roleRoutes = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
  main_director: "/main-director",
  support_director: "/support-director",
  main_hr: "/main-hr",
  support_hr: "/support-hr",
  main_admission: "/main-admission",
  support_admission: "/support-admission",
  doctor: "/doctor",
  chief: "/chief"
};

// Simple JWT decoder for middleware
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    
    return payload as { id: string; phone: string; role: string; name?: string; surname?: string; branchId?: any };
  } catch (error) {
    console.log('JWT decode error:', error);
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('=== MIDDLEWARE TRIGGERED ===');
  console.log('Path:', pathname);
  
  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    console.log('Public route, allowing access');
    return NextResponse.next();
  }

  // Allow API routes
  if (apiRoutes.includes(pathname)) {
    console.log('API route, allowing access');
    return NextResponse.next();
  }
  
  // Get authentication token from cookie
  const token = request.cookies.get("auth_token")?.value;
  console.log('Token found:', !!token);
  
  if (!token) {
    console.log('No token found, redirecting to login');
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Decode and verify token
  const user = decodeJWT(token);
  console.log('User from token:', user);
  
  if (!user) {
    console.log('Invalid token, redirecting to login');
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }
  
  // Check if user is accessing the correct role-based route
  const userRoleRoute = roleRoutes[user.role as keyof typeof roleRoutes];
  
  // If user role doesn't have a defined route, redirect to login with error
  if (!userRoleRoute) {
    console.log('User role not supported:', user.role);
    const response = NextResponse.redirect(new URL("/login?error=unsupported_role", request.url));
    response.cookies.delete("auth_token");
    return response;
  }
  
  if (pathname.startsWith("/admin") && user.role !== "admin") {
    console.log('Admin route accessed by non-admin, redirecting');
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/teacher") && user.role !== "teacher") {
    console.log('Teacher route accessed by non-teacher, redirecting');
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/student") && user.role !== "student") {
    console.log('Student route accessed by non-student, redirecting');
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  
  // Handle root path - redirect to their role dashboard
  if (pathname === "/") {
    console.log('Root path, redirecting to role dashboard');
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  
  // Add user info to request headers for use in pages
  const response = NextResponse.next();
  
  console.log('Setting headers for user:', user);
  
  response.headers.set("x-user-id", user.id);
  response.headers.set("x-user-role", user.role);
  response.headers.set("x-user-phone", user.phone || '');
  response.headers.set("x-user-name", user.name || 'User');
  response.headers.set("x-user-surname", user.surname || 'User');
  if (user.branchId !== undefined && user.branchId !== null) {
    response.headers.set("x-branch-id", String(user.branchId));
  }
  
  console.log('Headers set successfully');
  
  // Set cookie for client-side access
  response.cookies.set('userId', user.id, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp).*)',
  ],
};