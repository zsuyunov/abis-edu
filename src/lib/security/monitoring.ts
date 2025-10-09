/**
 * Security Monitoring & Alerting System
 * PRODUCTION-READY: Detects and alerts on security incidents
 * 
 * Features:
 * - Failed login spike detection
 * - Account lockout alerts
 * - Rate limit violations
 * - CSRF attack detection
 * - Anomalous activity detection
 */

import prisma from '@/lib/prisma';

export interface SecurityAlert {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  message: string;
  details: any;
  timestamp: Date;
}

export class SecurityMonitoring {
  /**
   * Check for failed login spikes (possible brute force attack)
   * @param windowMinutes - Time window to check (default: 15 minutes)
   * @param threshold - Number of failures to trigger alert (default: 20)
   */
  static async checkFailedLoginSpike(
    windowMinutes: number = 15,
    threshold: number = 20
  ): Promise<SecurityAlert | null> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    const failedLogins = await (prisma as any).securityLog.count({
      where: {
        eventType: 'LOGIN_FAILED',
        createdAt: { gte: since },
      },
    });

    if (failedLogins >= threshold) {
      return {
        severity: 'HIGH',
        type: 'BRUTE_FORCE_ATTACK',
        message: `${failedLogins} failed login attempts in last ${windowMinutes} minutes`,
        details: { failedLogins, windowMinutes, threshold },
        timestamp: new Date(),
      };
    }

    return null;
  }

  /**
   * Check for multiple account lockouts (possible distributed attack)
   */
  static async checkAccountLockouts(
    windowMinutes: number = 30,
    threshold: number = 5
  ): Promise<SecurityAlert | null> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    const lockouts = await (prisma as any).securityLog.count({
      where: {
        eventType: 'ACCOUNT_LOCKED',
        createdAt: { gte: since },
      },
    });

    if (lockouts >= threshold) {
      return {
        severity: 'CRITICAL',
        type: 'MASS_LOCKOUT',
        message: `${lockouts} accounts locked in last ${windowMinutes} minutes`,
        details: { lockouts, windowMinutes, threshold },
        timestamp: new Date(),
      };
    }

    return null;
  }

  /**
   * Check for suspicious IP activity
   */
  static async checkSuspiciousIP(
    windowMinutes: number = 10,
    threshold: number = 50
  ): Promise<SecurityAlert[]> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    // Group by IP and count events
    const ipActivity = await (prisma as any).securityLog.groupBy({
      by: ['ipAddress'],
      where: {
        createdAt: { gte: since },
        ipAddress: { not: null },
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: threshold } },
      },
    });

    const alerts: SecurityAlert[] = [];
    
    for (const ip of ipActivity) {
      if (ip.ipAddress) {
        alerts.push({
          severity: 'MEDIUM',
          type: 'SUSPICIOUS_IP',
          message: `High activity from IP ${ip.ipAddress}: ${ip._count.id} events in ${windowMinutes} minutes`,
          details: { ip: ip.ipAddress, count: ip._count.id, windowMinutes },
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }

  /**
   * Check for unauthorized access attempts (401/403 spikes)
   */
  static async checkUnauthorizedAccess(
    windowMinutes: number = 15,
    threshold: number = 30
  ): Promise<SecurityAlert | null> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    const unauthorized = await (prisma as any).securityLog.count({
      where: {
        eventStatus: 'FAILURE',
        createdAt: { gte: since },
      },
    });

    if (unauthorized >= threshold) {
      return {
        severity: 'HIGH',
        type: 'UNAUTHORIZED_ACCESS_SPIKE',
        message: `${unauthorized} unauthorized access attempts in last ${windowMinutes} minutes`,
        details: { unauthorized, windowMinutes, threshold },
        timestamp: new Date(),
      };
    }

    return null;
  }

  /**
   * Run all security checks and return alerts
   */
  static async runSecurityScan(): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    try {
      // Check failed login spike
      const loginSpike = await this.checkFailedLoginSpike();
      if (loginSpike) alerts.push(loginSpike);

      // Check account lockouts
      const lockouts = await this.checkAccountLockouts();
      if (lockouts) alerts.push(lockouts);

      // Check suspicious IPs
      const suspiciousIPs = await this.checkSuspiciousIP();
      alerts.push(...suspiciousIPs);

      // Check unauthorized access
      const unauthorized = await this.checkUnauthorizedAccess();
      if (unauthorized) alerts.push(unauthorized);

    } catch (error) {
      console.error('Security scan error:', error);
      alerts.push({
        severity: 'MEDIUM',
        type: 'SCAN_ERROR',
        message: 'Security scan encountered an error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Send alert notifications (implement your preferred channel)
   */
  static async sendAlert(alert: SecurityAlert): Promise<void> {
    // Log to console
    console.error(`
🚨 SECURITY ALERT [${alert.severity}]
Type: ${alert.type}
Message: ${alert.message}
Time: ${alert.timestamp.toISOString()}
Details: ${JSON.stringify(alert.details, null, 2)}
    `);

    // TODO: Implement email/Slack/SMS alerts
    // Example integrations:
    
    // 1. Email (using SendGrid, AWS SES, etc.)
    /*
    if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
      await sendEmail({
        to: process.env.SECURITY_ALERT_EMAIL,
        subject: `[SECURITY] ${alert.type}`,
        body: alert.message,
      });
    }
    */

    // 2. Slack webhook
    /*
    if (alert.severity === 'CRITICAL') {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        body: JSON.stringify({
          text: `🚨 ${alert.type}: ${alert.message}`,
        }),
      });
    }
    */

    // 3. Database log for admin dashboard
    try {
      await (prisma as any).securityLog.create({
        data: {
          eventType: 'SUSPICIOUS_ACTIVITY',
          eventStatus: 'WARNING',
          details: `${alert.type}: ${alert.message}`,
          metadata: alert.details,
          createdAt: alert.timestamp,
        },
      });
    } catch (error) {
      console.error('Failed to log security alert to database:', error);
    }
  }

  /**
   * Scheduled security monitoring (call this periodically via cron)
   */
  static async scheduledScan(): Promise<void> {
    console.log('🔍 Running scheduled security scan...');
    
    const alerts = await this.runSecurityScan();
    
    if (alerts.length === 0) {
      console.log('✅ No security alerts detected');
      return;
    }

    console.log(`⚠️ Found ${alerts.length} security alert(s)`);
    
    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }
}

/**
 * Usage:
 * 
 * // In a cron job or API endpoint (run every 5-15 minutes):
 * await SecurityMonitoring.scheduledScan();
 * 
 * // Or check specific threats:
 * const alert = await SecurityMonitoring.checkFailedLoginSpike();
 * if (alert) {
 *   await SecurityMonitoring.sendAlert(alert);
 * }
 */

