/**
 * Security Monitoring Endpoint
 * Run security scans and get current threat status
 * 
 * This endpoint should be:
 * 1. Called by a cron job every 5-15 minutes
 * 2. Protected with admin-only access
 * 3. Used to trigger alerts
 */

import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import { SecurityMonitoring } from '@/lib/security/monitoring';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Decode and verify admin role
    try {
      const parts = authToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.role !== 'admin') {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Run security scan
    const alerts = await SecurityMonitoring.runSecurityScan();

    // Send critical alerts
    for (const alert of alerts) {
      if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
        await SecurityMonitoring.sendAlert(alert);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      alertCount: alerts.length,
      alerts: alerts,
      summary: {
        critical: alerts.filter(a => a.severity === 'CRITICAL').length,
        high: alerts.filter(a => a.severity === 'HIGH').length,
        medium: alerts.filter(a => a.severity === 'MEDIUM').length,
        low: alerts.filter(a => a.severity === 'LOW').length,
      },
    });
  } catch (error) {
    console.error('Security monitoring error:', error);
    return NextResponse.json(
      { 
        error: 'Security monitoring failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Manual trigger for scheduled scan
async function postHandler(request: NextRequest) {
  try {
    // Admin auth check (same as GET)
    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const parts = authToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      if (payload.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    // Run scheduled scan
    await SecurityMonitoring.scheduledScan();

    return NextResponse.json({
      success: true,
      message: 'Security scan completed and alerts sent',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scheduled scan error:', error);
    return NextResponse.json(
      { error: 'Scan failed' },
      { status: 500 }
    );
  }
}

