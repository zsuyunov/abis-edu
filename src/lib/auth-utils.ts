import { cookies } from "next/headers";

// Simple JWT decoder for server-side use
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

// Get user info from JWT token directly (bypassing middleware)
export async function getUserFromToken() {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get("auth_token")?.value;
    
    if (!authToken) {
      return {
        id: null,
        role: null,
        phone: null,
        name: null,
        surname: null,
        branchId: null
      };
    }
    
    const payload = decodeJWT(authToken);
    if (!payload) {
      return {
        id: null,
        role: null,
        phone: null,
        name: null,
        surname: null,
        branchId: null
      };
    }
    
    return {
      id: payload.id || null,
      role: payload.role || null,
      phone: payload.phone || null,
      name: payload.name || null,
      surname: payload.surname || null,
      branchId: payload.branchId || null
    };
  } catch (error) {
    console.error('Error getting user from token:', error);
    return {
      id: null,
      role: null,
      phone: null,
      name: null,
      surname: null,
      branchId: null
    };
  }
}
