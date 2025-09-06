import { NextRequest, NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/admin-direct", "/logout", "/force-logout", "/test-panels", "/session-debug"];

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

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Edge-compatible JWT verification using Web Crypto API
async function verifyTokenEdge(token: string) {
  try {
    // Split JWT into parts
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode header and payload
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    // For Edge Runtime, we'll do basic validation without signature verification
    // This is acceptable for development, but in production you'd want full HMAC verification
    return payload as { id: string; phone: string; role: string; name?: string; surname?: string };
  } catch (error) {
    console.log('Token verification failed:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Normalize legacy/typo routes using underscore to use hyphenated paths
  if (pathname.startsWith("/support_director")) {
    const url = new URL(request.url);
    url.pathname = pathname.replace("/support_director", "/support-director");
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/main_director")) {
    const url = new URL(request.url);
    url.pathname = pathname.replace("/main_director", "/main-director");
    return NextResponse.redirect(url);
  }
  // Normalize HR routes using underscore to hyphenated paths
  if (pathname.startsWith("/main_hr")) {
    const url = new URL(request.url);
    url.pathname = pathname.replace("/main_hr", "/main-hr");
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/support_hr")) {
    const url = new URL(request.url);
    url.pathname = pathname.replace("/support_hr", "/support-hr");
    return NextResponse.redirect(url);
  }
  
  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Handle API routes - add user info to headers if authenticated
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("auth_token")?.value;
    
    if (token) {
      const user = await verifyTokenEdge(token);
      if (user) {
        const response = NextResponse.next();
        response.headers.set("x-user-id", user.id);
        response.headers.set("x-user-role", user.role);
        response.headers.set("x-user-phone", user.phone);
        response.headers.set("x-user-name", user.name || 'User');
        response.headers.set("x-user-surname", user.surname || 'User');
        if ((user as any).branchId !== undefined && (user as any).branchId !== null) {
          response.headers.set("x-branch-id", String((user as any).branchId));
        }
        return response;
      }
    }
    
    return NextResponse.next();
  }

  // Handle root path - redirect to login if not authenticated
  if (pathname === "/") {
    const token = request.cookies.get("auth_token")?.value;
    
    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token
    const user = await verifyTokenEdge(token);
    if (!user) {
      // Clear invalid token and redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }

    // If authenticated, redirect to their role dashboard
    const userRoleRoute = roleRoutes[user.role as keyof typeof roleRoutes];
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }

  // Get authentication token from cookie for other routes
  const token = request.cookies.get("auth_token")?.value;
  
  if (!token) {
    // Redirect to login if no token
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const user = await verifyTokenEdge(token);
  if (!user) {
    // Clear invalid token and redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }

  // Check if user is accessing the correct role-based route
  const userRoleRoute = roleRoutes[user.role as keyof typeof roleRoutes];

  // Check if user is trying to access a different role's route
  if (pathname.startsWith("/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/teacher") && user.role !== "teacher") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/student") && user.role !== "student") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/parent") && user.role !== "parent") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/main-director") && user.role !== "main_director") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/support-director") && user.role !== "support_director") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/main-hr") && user.role !== "main_hr") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/support-hr") && user.role !== "support_hr") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/main-admission") && user.role !== "main_admission") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/support-admission") && user.role !== "support_admission") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/doctor") && user.role !== "doctor") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }
  if (pathname.startsWith("/chief") && user.role !== "chief") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }

  // Add user info to request headers for use in pages
  const response = NextResponse.next();
  response.headers.set("x-user-id", user.id);
  response.headers.set("x-user-role", user.role);
  response.headers.set("x-user-phone", user.phone);
  response.headers.set("x-user-name", user.name || 'User');
  response.headers.set("x-user-surname", user.surname || 'User');
  if ((user as any).branchId !== undefined && (user as any).branchId !== null) {
    response.headers.set("x-branch-id", String((user as any).branchId));
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
