import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { RouteHandler, AuthenticatedUser, Locals } from './authenticateJWT';

type AuditOptions = {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  pickMetadata?: (request: NextRequest) => Promise<Record<string, unknown> | undefined> | Record<string, unknown> | undefined;
};

export function auditLogger(options: AuditOptions) {
  return function (handler: RouteHandler): RouteHandler {
    return async function (request: NextRequest, context?: any, locals?: Locals) {
      const user = locals?.user as AuthenticatedUser | undefined;
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;

      const response = await handler(request, context, locals);

      // Temporarily disable audit logging until AuditLog table is created
      // TODO: Re-enable after creating migration for AuditLog table
      if (false) {
        try {
          if (response && response.ok && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
            const route = new URL(request.url).pathname;
            const meta = (await options.pickMetadata?.(request)) || undefined;
            await prisma.auditLog.create({
              data: {
                userId: user?.id || null,
                route,
                action: options.action,
                ipAddress: ip || null,
                metadata: meta as any,
              },
            });
          }
        } catch (e) {
          // Swallow logging errors to avoid breaking user flow
          console.warn('Audit logging failed:', e);
        }
      }

      return response;
    };
  };
}


