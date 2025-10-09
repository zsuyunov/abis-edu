import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Add connection pooling parameters to DATABASE_URL for Neon
  const databaseUrl = process.env.DATABASE_URL || '';
  const urlWithPooling = databaseUrl.includes('?') 
    ? `${databaseUrl}&connection_limit=10&pool_timeout=20&connect_timeout=10`
    : `${databaseUrl}?connection_limit=10&pool_timeout=20&connect_timeout=10`;

  return new PrismaClient({
    // Only log errors and warnings, no query logs
    log: ['error', 'warn'],
    // Performance optimizations
    errorFormat: 'minimal',
    // Connection management for Neon with pooling
    datasources: {
      db: {
        url: urlWithPooling,
      },
    },
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

// Optimize Prisma for production and static generation
if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
  // Enable connection pooling and warm up connections
  prisma.$connect().then(() => {
    console.log('✅ Database connected with connection pooling')
  }).catch((error) => {
    console.error('❌ Database connection failed:', error)
  })
}

export default prisma
export { prisma }

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

// Lightweight retry helper for transient DB disconnects
export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  options?: { retries?: number; baseDelayMs?: number }
): Promise<T> {
  const maxRetries = options?.retries ?? 2
  const baseDelayMs = options?.baseDelayMs ?? 150

  let attempt = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await operation()
    } catch (error: unknown) {
      const message = typeof error === 'object' && error && 'message' in error ? String((error as any).message) : ''
      const errorString = String(error);

      const isTransient =
        message.includes('Server has closed the connection') ||
        message.includes('Connection terminated unexpectedly') ||
        message.includes('ECONNRESET') ||
        message.includes('read ECONNRESET') ||
        message.includes('Connection closed') ||
        message.includes('Connection lost') ||
        errorString.includes('kind: Closed') ||
        message.includes('ETIMEDOUT') ||
        message.includes('ENOTFOUND');

      if (!isTransient || attempt >= maxRetries) {
        throw error
      }

      attempt += 1
      console.warn(`⚠️ Database connection issue detected (attempt ${attempt}/${maxRetries}), retrying...`);
      
      try {
        // Force disconnect and reconnect
        await prisma.$disconnect();
        await prisma.$connect();
      } catch (reconnectError) {
        // Ignore reconnect errors; we'll still backoff and retry the operation
        console.warn('   Reconnect attempt failed, will retry operation anyway');
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
}

// Helper function for optimized queries with includes
export const optimizedInclude = {
  // Common includes for different entities
  student: {
    branch: { select: { id: true, shortName: true } },
    class: { select: { id: true, name: true } }
  },
  teacher: {
    // Teacher no longer has direct branch/subjects/classes in the new schema
    // Keep include empty to avoid Prisma validation errors
  },
  attendance: {
    student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
    teacher: { select: { id: true, firstName: true, lastName: true } },
    subject: { select: { id: true, name: true } },
    class: { select: { id: true, name: true } }
  },
  grade: {
    student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
    teacher: { select: { id: true, firstName: true, lastName: true } },
    subject: { select: { id: true, name: true } },
    class: { select: { id: true, name: true } }
  }
}

// Helper function for pagination
export const getPaginationParams = (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit
  return { skip, take: limit }
}

// Helper function for search and filter queries
export const buildSearchQuery = (searchTerm?: string, searchFields: string[] = []) => {
  if (!searchTerm || searchFields.length === 0) return {}
  
  return {
    OR: searchFields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const
      }
    }))
  }
}
