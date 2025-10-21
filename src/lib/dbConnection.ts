import { NextRequest, NextResponse } from "next/server";
import prisma, { withPrismaRetry } from "./prisma";

/**
 * Database connection wrapper that ensures proper connection handling
 * and provides retry logic for transient connection issues.
 * 
 * This function wraps API route handlers to ensure database connections
 * are properly managed and retried on transient failures.
 */
export function withConnection<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      // Ensure database connection is established
      await prisma.$connect();
      
      // Execute the handler with retry logic for database operations
      // Use more aggressive retry settings for critical operations
      return await withPrismaRetry(async () => {
        return await handler(...args);
      }, { retries: 4, baseDelayMs: 300 });
    } catch (error) {
      console.error("Database connection error in withConnection:", error);
      
      // Check if this is a Prisma engine error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Response from the Engine was empty') || 
          errorMessage.includes('Engine is not yet connected')) {
        console.error("🚨 Critical Prisma engine failure detected");
        
        // Return a more specific error for engine failures
        return NextResponse.json(
          { 
            error: "Database engine is temporarily unavailable. Please try again in a moment.",
            code: "ENGINE_ERROR"
          },
          { status: 503 } // Service Unavailable
        );
      }
      
      // Return a generic error response for other errors
      return NextResponse.json(
        { error: "Database connection error. Please try again later." },
        { status: 500 }
      );
    } finally {
      // Always disconnect to free up connections
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
        console.warn("Warning: Error disconnecting from database:", disconnectError);
      }
    }
  };
}

/**
 * Simple database connection check utility
 * Returns true if database is accessible, false otherwise
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error("Database connection check failed:", error);
    return false;
  }
}

/**
 * Execute a database operation with automatic retry logic
 * This is a lower-level utility for direct database operations
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options?: { retries?: number; baseDelayMs?: number }
): Promise<T> {
  return await withPrismaRetry(operation, options);
}
