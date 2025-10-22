import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/dbConnection';

/**
 * Database health check endpoint
 * Returns database connection status for monitoring
 */
export async function GET() {
  try {
    const isConnected = await checkDatabaseConnection();

    if (isConnected) {
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      database: 'unknown',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
