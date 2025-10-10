import { NextRequest, NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { verifyJwt } from "@/lib/security/verifyJwt";

/**
 * SECURITY FIX: Removed insecure decodeJwt function
 * Now using verifyJwt which checks JWT signature
 */

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const currentUserId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");
    const userPhone = headersList.get("x-user-phone");
    const userName = headersList.get("x-user-name");
    const userSurname = headersList.get("x-user-surname");
    const branchIdHeader = headersList.get("x-branch-id");

    // If we have user data from middleware, use it
    if (currentUserId && userRole) {
      const response = NextResponse.json({
        success: true,
        user: {
          id: currentUserId,
          phone: userPhone || "",
          role: userRole,
          name: userName || "User",
          surname: userSurname || "User",
          branchId: branchIdHeader ? Number(branchIdHeader) : undefined,
        },
      });

      // Cache for fast subsequent requests
      response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
      return response;
    }

    // Try reading from auth cookie with signature verification (SECURITY FIX)
    const authToken = cookies().get("auth_token")?.value;
    if (authToken) {
      const payload = verifyJwt(authToken);
      if (payload) {
        const response = NextResponse.json({
          success: true,
          user: {
            id: payload.id,
            phone: payload.phone || "",
            role: payload.role,
            name: payload.name || "User",
            surname: payload.surname || "User",
            branchId: payload.branchId ?? undefined,
          },
        });
        response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
        return response;
      }
    }

    // Fallback data for development/testing
    const response = NextResponse.json({
      success: true,
      user: {
        id: "loading",
        phone: "",
        role: "loading",
        name: "Loading",
        surname: "User",
      },
    });

    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (error) {
    console.error("Auth me error:", error);
    // Always return success with fallback to prevent loading issues
    return NextResponse.json({
      success: true,
      user: {
        id: "loading",
        phone: "",
        role: "loading", 
        name: "Loading",
        surname: "User",
      }
    });
  }
}
