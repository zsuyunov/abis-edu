import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/security/verifyJwt';

export type AuthenticatedUser = {
  id: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | string;
  tokenVersion: number;
  name?: string;
  surname?: string;
  branchId?: string | number;
};

export type HandlerContext = { params?: any };
export type Locals = { user?: AuthenticatedUser } & Record<string, unknown>;
export type RouteHandler = (request: NextRequest, context?: HandlerContext, locals?: Locals) => Promise<NextResponse> | NextResponse;

function extractBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

export function authenticateJWT(handler: RouteHandler): RouteHandler {
  return async function (request: NextRequest, context?: HandlerContext, locals?: Locals) {
    // First, check if the middleware has already authenticated the user via headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (userId && userRole) {
      // User is already authenticated by the middleware
      const user: AuthenticatedUser = {
        id: userId,
        role: userRole.toUpperCase(),
        tokenVersion: parseInt(request.headers.get('x-token-version') || '0'),
        name: request.headers.get('x-user-name') || undefined,
        surname: request.headers.get('x-user-surname') || undefined,
        branchId: request.headers.get('x-branch-id') ? parseInt(request.headers.get('x-branch-id')!) : undefined,
      };
      
      // Attach to request.locals for backward compatibility
      if (!(request as any).locals) {
        (request as any).locals = {};
      }
      (request as any).locals.user = user;
      
      const nextLocals: Locals = { ...(locals || {}), user };
      return handler(request, context, nextLocals);
    }

    // Fallback: Check for Authorization header (for API calls with Bearer token)
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Bearer token required' }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Forbidden: Invalid or expired token' }, { status: 403 });
    }

    const user: AuthenticatedUser = {
      id: decoded.id,
      role: (decoded.role || '').toUpperCase(),
      tokenVersion: decoded.tokenVersion ?? 0,
      name: decoded.name,
      surname: decoded.surname,
      branchId: decoded.branchId,
    };

    // Attach to request.locals for backward compatibility
    if (!(request as any).locals) {
      (request as any).locals = {};
    }
    (request as any).locals.user = user;

    const nextLocals: Locals = { ...(locals || {}), user };
    return handler(request, context, nextLocals);
  };
}

export function composeHandlers(...middlewares: Array<(h: RouteHandler) => RouteHandler>) {
  return (handler: RouteHandler): RouteHandler => middlewares.reduceRight((acc, mw) => mw(acc), handler);
}


