import { NextRequest, NextResponse } from "next/server";
import { headers, cookies } from "next/headers";

function decodeJwt(token: string | undefined) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), "base64").toString("utf8"));
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    return payload as { id: string; phone: string; role: string; name?: string; surname?: string };
  } catch {
    return null;
  }
}

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

    // Try reading from auth cookie directly (ensures correct role even if headers missing)
    const authToken = cookies().get("auth_token")?.value;
    const payload = decodeJwt(authToken);
    if (payload) {
      const response = NextResponse.json({
        success: true,
        user: {
          id: payload.id,
          phone: payload.phone || "",
          role: payload.role,
          name: payload.name || "User",
          surname: payload.surname || "User",
          branchId: (payload as any).branchId ?? undefined,
        },
      });
      response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
      return response;
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
