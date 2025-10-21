import { NextRequest, NextResponse } from 'next/server';
import type { RouteHandler, AuthenticatedUser, Locals } from './authenticateJWT';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export function authorizeRole(...allowed: Role[]) {
  return function (handler: RouteHandler | any): RouteHandler {
    return async function (request: NextRequest, context?: any, locals?: Locals) {
      const user = locals?.user as AuthenticatedUser | undefined;
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const role = (user.role || '').toUpperCase();
      if (!allowed.map(r => r.toUpperCase()).includes(role)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      // Call handler with all parameters, but handler may not use all of them
      try {
        return await handler(request, context, locals);
      } catch (error) {
        // If handler doesn't accept all parameters, try with fewer
        return await handler(request, context);
      }
    };
  };
}


