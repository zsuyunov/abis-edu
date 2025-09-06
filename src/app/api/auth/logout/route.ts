import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });

    // Clear all authentication-related cookies
    const cookiesToClear = [
      "auth_token",
      "__session", 
      "__session_61dFzdSC",
      "__clerk_db_jwt",
      "__clerk_db_jwt_u6pPacZK",
      "__clerk_db_jwt_TDWNA_Aa", 
      "__clerk_db_jwt_61dFzdSC"
    ];
    
    cookiesToClear.forEach(cookie => {
      response.cookies.set(cookie, '', {
        httpOnly: false, // Allow client-side clearing
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      });
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
