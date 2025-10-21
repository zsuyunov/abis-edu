/**
 * Enhanced Security Middleware
 * - Verifies JWT tokens with tokenVersion validation (Edge Runtime compatible)
 * - Applies security headers (HSTS, CSP, etc.)
 * - Role-based access control
 * - Automatic token refresh when near expiry
 * 
 * SECURITY: Uses jose library for Edge Runtime compatibility (no Node.js crypto dependency)
 */

import { NextRequest, NextResponse } from "next/server";
import { SecurityHeaders } from "@/lib/security/headers";
import { verifyJwtEdge } from "@/lib/security/verifyJwtEdge";

// Define public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/admin-direct",
  "/logout",
  "/force-logout",
  "/test-panels",
  "/session-debug",
];

// Define API routes that should be allowed through
const publicApiRoutes = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/auth/password-reset/request",
  "/api/auth/password-reset/complete",
];

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
  chief: "/chief",
};

/**
 * SECURITY: Edge Runtime JWT verification using jose library
 * 
 * Uses verifyJwtEdge which:
 * - Verifies JWT signature with secret (Edge Runtime compatible)
 * - Validates issuer and audience
 * - Checks expiry automatically
 * - Rejects tokens with alg: none or invalid signatures
 * - Rejects legacy tokens without tokenVersion
 * 
 * Full tokenVersion validation against DB happens in API routes via TokenService
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response
  let response = NextResponse.next();

  // Apply security headers to ALL responses
  response = SecurityHeaders.apply(response);

  // Strict CORS for API routes
  if (pathname.startsWith('/api/')) {
    const allowedOrigin = process.env.FRONTEND_ORIGIN;
    if (allowedOrigin) {
      response.headers.set('Vary', 'Origin');
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-CSRF-Token');
    }
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  // Allow Next.js Server Actions (they have special headers)
  const isServerAction = request.headers.get('next-action') !== null || 
                         request.headers.get('content-type')?.includes('multipart/form-data');
  
  if (isServerAction) {
    // Server actions need the user context - verify token with Edge-compatible verification
    const token = request.cookies.get("auth_token")?.value;
    if (token) {
      const user = await verifyJwtEdge(token);
      if (user && user.tokenVersion !== undefined) {
        // Add user info to headers for server actions
        response.headers.set("x-user-id", user.id);
        response.headers.set("x-user-role", user.role);
        response.headers.set("x-user-phone", user.phone || "");
        response.headers.set("x-user-name", user.name || "User");
        response.headers.set("x-user-surname", user.surname || "User");
        response.headers.set("x-token-version", String(user.tokenVersion));
        if (user.branchId !== undefined && user.branchId !== null) {
          response.headers.set("x-branch-id", String(user.branchId));
        }
      }
    }
    return response;
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return response;
  }

  // Allow public API routes
  if (publicApiRoutes.some(route => pathname === route)) {
    return response;
  }

  // Allow Next.js static files and API routes that don't need auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname === "/favicon.ico"
  ) {
    return response;
  }

  // Get authentication token from cookie
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    // Redirect to login for protected pages
    if (!pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    // Return 401 for API routes
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Verify token with Edge-compatible signature check
  const user = await verifyJwtEdge(token);

  if (!user) {
    // Token is invalid, expired, or has invalid signature
    const redirectResponse = pathname.startsWith("/api")
      ? NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        )
      : NextResponse.redirect(new URL("/login?error=session_expired", request.url));

    // Clear invalid token
    redirectResponse.cookies.delete("auth_token");
    redirectResponse.cookies.delete("refresh_token");
    return redirectResponse;
  }

  // Note: tokenVersion check is already done in verifyJwtEdge
  // It rejects tokens without tokenVersion or with invalid signatures

  // Check if token is near expiry (less than 5 minutes remaining)
  // Suggest refresh to client via header
  if (user.exp) {
    const timeUntilExpiry = user.exp * 1000 - Date.now();
    if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
      response.headers.set("X-Token-Refresh-Suggested", "true");
    }
  }

  // Check if user role has a defined route
  const userRoleRoute = roleRoutes[user.role as keyof typeof roleRoutes];

  if (!userRoleRoute) {
    // Unsupported role
    const errorResponse = pathname.startsWith("/api")
      ? NextResponse.json(
          { error: "Unsupported user role" },
          { status: 403 }
        )
      : NextResponse.redirect(new URL("/login?error=unsupported_role", request.url));

    errorResponse.cookies.delete("auth_token");
    return errorResponse;
  }

  // STRICT Role-based access control for UI routes (not API routes)
  // API routes are protected by their own middleware (authenticateJWT + authorizeRole)
  if (!pathname.startsWith('/api/')) {
    // Students can ONLY access /student routes
    if (user.role === "student") {
      if (!pathname.startsWith("/student") && pathname !== "/") {
        console.warn(`🚨 SECURITY: Student ${user.id} attempted to access ${pathname}`);
        return NextResponse.redirect(new URL("/student", request.url));
      }
    }
    
    // Teachers can ONLY access /teacher routes
    if (user.role === "teacher") {
      if (!pathname.startsWith("/teacher") && pathname !== "/") {
        console.warn(`🚨 SECURITY: Teacher ${user.id} attempted to access ${pathname}`);
        return NextResponse.redirect(new URL("/teacher", request.url));
      }
    }
    
    // Parents can ONLY access /parent routes
    if (user.role === "parent") {
      if (!pathname.startsWith("/parent") && pathname !== "/") {
        console.warn(`🚨 SECURITY: Parent ${user.id} attempted to access ${pathname}`);
        return NextResponse.redirect(new URL("/parent", request.url));
      }
    }
    
    // Admins can ONLY access /admin routes
    if (user.role === "admin") {
      if (!pathname.startsWith("/admin") && pathname !== "/") {
        console.warn(`🚨 SECURITY: Admin ${user.id} attempted to access ${pathname}`);
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
  }

  // Handle root path - redirect to role dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL(userRoleRoute, request.url));
  }

  // Add user info to request headers for use in pages/API routes
  response.headers.set("x-user-id", user.id);
  response.headers.set("x-user-role", user.role);
  response.headers.set("x-user-phone", user.phone || "");
  response.headers.set("x-user-name", user.name || "User");
  response.headers.set("x-user-surname", user.surname || "User");
  
  if (user.tokenVersion !== undefined) {
    response.headers.set("x-token-version", String(user.tokenVersion));
  }
  
  if (user.branchId !== undefined && user.branchId !== null) {
    response.headers.set("x-branch-id", String(user.branchId));
  }

  // Set non-httpOnly cookie for client-side access (if needed)
  response.cookies.set("userId", user.id, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Changed from 'strict' to 'lax' for better compatibility
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon files
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp).*)",
  ],
};
