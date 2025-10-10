import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  userId: string;
  role: string;
  branchId?: number;
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  try {
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    // SECURITY FIX: Specify algorithms to prevent 'alg: none' attacks
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'], // Only allow HMAC SHA-256
    }) as any;
    
    return {
      userId: decoded.userId,
      role: decoded.role,
      branchId: decoded.branchId,
    };
  } catch (error) {
    return null;
  }
}

export function createAuthToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

// For client-side components (stub implementation)
export function useAuth() {
  // This would typically connect to your state management solution
  // For now, returning a stub that matches the Clerk interface
  return {
    userId: 'chief-001', // This should come from your client-side auth state
    isLoaded: true,
    isSignedIn: true,
  };
}
