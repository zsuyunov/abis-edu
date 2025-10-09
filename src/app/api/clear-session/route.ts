import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';

async function postHandler(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "All sessions cleared successfully"
    });

    // Comprehensive list of all possible authentication cookies
    const allAuthCookies = [
      "auth_token",
      "__session", 
      "__session_61dFzdSC",
      "__clerk_db_jwt",
      "__clerk_db_jwt_u6pPacZK",
      "__clerk_db_jwt_TDWNA_Aa", 
      "__clerk_db_jwt_61dFzdSC",
      "__client_uat",
      "__client_uat_61dFzdSC",
      "__client_uat_u6pPacZK",
      "__client_uat_TDWNA_Aa",
      "remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d",
      "csrftoken",
      "__stripe_mid",
      "stack-refresh-8a9dc9ac-3c3d-4530-a664-d4bf63eae1f4",
      "ajs_anonymous_id"
    ];
    
    // Clear all cookies with different methods
    allAuthCookies.forEach(cookie => {
      // Method 1: Standard clearing
      response.cookies.set(cookie, '', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
        expires: new Date(0)
      });
      
      // Method 2: Localhost domain
      response.cookies.set(cookie, '', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
        domain: 'localhost',
        expires: new Date(0)
      });
    });

    // Set headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error("Clear session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withCSRF(postHandler);

export async function GET(request: NextRequest) {
  // Allow GET requests too for easy testing
  return postHandler(request);
}
