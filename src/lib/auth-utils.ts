import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/security/verifyJwt";

/**
 * SECURITY FIX: Now uses proper JWT signature verification
 * Previously: Used insecure decodeJWT without signature verification
 * Now: Uses verifyJwt which validates signatures before trusting payload
 */

// Get user info from JWT token with signature verification
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
    
    // SECURITY: Verify JWT signature before trusting payload
    const payload = verifyJwt(authToken);
    if (!payload) {
      console.warn('⚠️ Invalid JWT signature in getUserFromToken');
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
