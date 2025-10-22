import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Add connection pooling parameters to DATABASE_URL for better timeout handling
  const databaseUrl = process.env.DATABASE_URL || '';

  // More robust connection parameters for serverless environments
  const connectionParams = [
    'connection_limit=5',        // Lower limit for serverless
    'pool_timeout=30',           // Longer pool timeout
    'connect_timeout=15',        // Longer connect timeout
    'socket_timeout=30',         // Longer socket timeout
    'application_name=school_app', // Identify our app
    'keepalives=1',              // Enable TCP keepalives
    'keepalives_idle=30',        // Keepalive idle time
    'keepalives_interval=10',    // Keepalive interval
    'keepalives_count=5'         // Keepalive count
  ].join('&');

  const urlWithPooling = databaseUrl.includes('?')
    ? `${databaseUrl}&${connectionParams}`
    : `${databaseUrl}?${connectionParams}`;

  return new PrismaClient({
    // Only log errors and warnings in production, more verbose in development
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
    // Performance optimizations
    errorFormat: 'minimal',
    // Connection management for better timeout handling
    datasources: {
      db: {
        url: urlWithPooling,
      },
    },
    // Transaction options for serverless
    transactionOptions: {
      maxWait: 20000, // 20 seconds
      timeout: 15000, // 15 seconds
    },
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

// Connection management for serverless environments
const ensureConnection = async () => {
  try {
    // Test the connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection verified')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    // Try to reconnect
    try {
      await prisma.$disconnect()
      await prisma.$connect()
      console.log('✅ Database reconnected successfully')
    } catch (reconnectError) {
      console.error('❌ Database reconnection failed:', reconnectError)
    }
  }
}

// Ensure connection is established on startup
if (process.env.NODE_ENV !== 'production') {
  // In development, ensure connection is ready
  ensureConnection()
} else {
  // In production (serverless), connection will be established on first query
  console.log('🔄 Production environment - database connection will be established on first query')
}

// Helper function to identify connection errors
function isConnectionError(error: any): boolean {
  const message = error?.message || ''
  const errorString = String(error)

  return (
    message.includes('Engine is not yet connected') ||
    message.includes('Response from the Engine was empty') ||
    message.includes('Connection terminated unexpectedly') ||
    message.includes('Server has closed the connection') ||
    message.includes('Client disconnected') ||
    message.includes('Connection timeout') ||
    message.includes('Connection refused') ||
    message.includes('Network is unreachable') ||
    errorString.includes('P1001') || // Can't reach database server
    errorString.includes('P1002') || // The database server was not found
    errorString.includes('P2028') // Transaction API error
  )
}

// Middleware function to ensure database connection before operations
async function withDatabaseConnection<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    // Ensure connection is established
    await ensureConnection()
    return await operation()
  } catch (error) {
    // If it's a connection error, try to reconnect and retry once
    if (isConnectionError(error)) {
      console.warn('🔄 Connection error detected, attempting reconnection...')
      try {
        await prisma.$disconnect()
        await prisma.$connect()
        return await operation()
      } catch (retryError) {
        console.error('❌ Reconnection failed:', retryError)
        throw retryError
      }
    }
    throw error
  }
}

// Lightweight retry helper for transient DB disconnects
async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  options?: { retries?: number; baseDelayMs?: number }
): Promise<T> {
  const maxRetries = options?.retries ?? 3
  const baseDelayMs = options?.baseDelayMs ?? 200

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
        message.includes('ENOTFOUND') ||
        message.includes('Response from the Engine was empty') ||
        message.includes('Engine is not yet connected') ||
        message.includes('Client disconnected') ||
        message.includes('Connection timeout') ||
        message.includes('Connection refused') ||
        message.includes('Network is unreachable') ||
        errorString.includes('P1001') || // Can't reach database server
        errorString.includes('P1002') || // The database server was not found
        errorString.includes('P2028'); // Transaction API error

      if (!isTransient || attempt >= maxRetries) {
        throw error
      }

      attempt += 1
      console.warn(`⚠️ Database connection issue detected (attempt ${attempt}/${maxRetries}), retrying...`);

      try {
        // Force disconnect first
        await prisma.$disconnect();

        // For "Response from the Engine was empty" and "Engine is not yet connected" errors,
        // wait longer before reconnecting
        if (message.includes('Response from the Engine was empty') || message.includes('Engine is not yet connected')) {
          console.warn('   Prisma engine error detected, waiting longer before reconnect...');
          const waitTime = attempt === 1 ? 1000 : attempt === 2 ? 2000 : 3000;
          await new Promise((r) => setTimeout(r, waitTime));

          // If this is the second or third attempt and still failing, try to reset the global prisma instance
          if (attempt >= 2) {
            console.warn('   Multiple engine failures detected, attempting to reset Prisma client...');
            try {
              // Force disconnect and create a new instance
              await prisma.$disconnect();
              // Clear the global instance to force recreation
              globalThis.prismaGlobal = undefined;
              // The next operation will create a fresh instance
            } catch (resetError) {
              console.warn('   Prisma client reset failed:', resetError);
            }
          }
        }

        // Try to reconnect
        await prisma.$connect();
        console.warn('   Database reconnected successfully');
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

export default prisma
export { prisma, ensureConnection, withDatabaseConnection, withPrismaRetry }

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma