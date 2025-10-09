/**
 * Security Event Logger
 * Logs all authentication and security-related events for audit and monitoring
 * Follows OWASP logging best practices
 */

import prisma from '@/lib/prisma';

// Import types - these will be available after migration
type SecurityEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'MFA_VERIFICATION_SUCCESS'
  | 'MFA_VERIFICATION_FAILED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'SUSPICIOUS_ACTIVITY';

type SecurityEventStatus = 'SUCCESS' | 'FAILURE' | 'WARNING';

export interface SecurityLogData {
  userId?: string;
  userRole?: string;
  eventType: SecurityEventType;
  eventStatus: SecurityEventStatus;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  metadata?: Record<string, any>;
}

export class SecurityLogger {
  /**
   * Log a security event to the database
   * @param data - Security log data
   */
  static async log(data: SecurityLogData): Promise<void> {
    try {
      await (prisma as any).securityLog.create({
        data: {
          userId: data.userId,
          userRole: data.userRole,
          eventType: data.eventType,
          eventStatus: data.eventStatus,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          details: data.details,
          metadata: data.metadata || {},
        },
      });
    } catch (error) {
      // Never throw on logging errors - just log to console
      // This prevents logging failures from breaking the main flow
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Log a successful login
   */
  static async logLoginSuccess(
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      eventType: 'LOGIN_SUCCESS',
      eventStatus: 'SUCCESS',
      ipAddress,
      userAgent,
      details: 'User logged in successfully',
    });
  }

  /**
   * Log a failed login attempt
   */
  static async logLoginFailure(
    phone: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      eventType: 'LOGIN_FAILED',
      eventStatus: 'FAILURE',
      ipAddress,
      userAgent,
      details: `Login failed for phone ${phone}: ${reason}`,
      metadata: { phone, reason },
    });
  }

  /**
   * Log a logout event
   */
  static async logLogout(
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      eventType: 'LOGOUT',
      eventStatus: 'SUCCESS',
      ipAddress,
      userAgent,
      details: 'User logged out',
    });
  }

  /**
   * Log a token refresh event
   */
  static async logTokenRefresh(
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      eventType: 'TOKEN_REFRESH',
      eventStatus: 'SUCCESS',
      ipAddress,
      userAgent,
      details: 'Access token refreshed',
    });
  }

  /**
   * Log a password change
   */
  static async logPasswordChange(
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      eventType: 'PASSWORD_CHANGE',
      eventStatus: 'SUCCESS',
      ipAddress,
      userAgent,
      details: 'Password changed successfully',
    });
  }

  /**
   * Log a password reset request
   */
  static async logPasswordResetRequest(
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      eventType: 'PASSWORD_RESET_REQUEST',
      eventStatus: 'SUCCESS',
      ipAddress,
      userAgent,
      details: 'Password reset requested',
    });
  }

  /**
   * Log an account lock event
   */
  static async logAccountLocked(
    userId: string,
    userRole: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      eventType: 'ACCOUNT_LOCKED',
      eventStatus: 'WARNING',
      ipAddress,
      userAgent,
      details: `Account locked: ${reason}`,
      metadata: { reason },
    });
  }

  /**
   * Log MFA events
   */
  static async logMFAEnabled(
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      eventType: 'MFA_ENABLED',
      eventStatus: 'SUCCESS',
      ipAddress,
      userAgent,
      details: 'MFA enabled for account',
    });
  }

  static async logMFAVerificationSuccess(
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      eventType: 'MFA_VERIFICATION_SUCCESS',
      eventStatus: 'SUCCESS',
      ipAddress,
      userAgent,
      details: 'MFA code verified successfully',
    });
  }

  static async logMFAVerificationFailed(
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      eventType: 'MFA_VERIFICATION_FAILED',
      eventStatus: 'FAILURE',
      ipAddress,
      userAgent,
      details: 'MFA code verification failed',
    });
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(
    userId: string | undefined,
    userRole: string | undefined,
    details: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      eventType: 'SUSPICIOUS_ACTIVITY',
      eventStatus: 'WARNING',
      ipAddress,
      userAgent,
      details,
      metadata,
    });
  }

  /**
   * Get recent security logs for a user
   * @param userId - User ID
   * @param userRole - User role
   * @param limit - Number of logs to retrieve
   */
  static async getUserLogs(userId: string, userRole: string, limit: number = 50) {
    return await (prisma as any).securityLog.findMany({
      where: {
        userId,
        userRole,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get recent failed login attempts for monitoring
   * @param limit - Number of logs to retrieve
   */
  static async getRecentFailedLogins(limit: number = 100) {
    return await (prisma as any).securityLog.findMany({
      where: {
        eventType: 'LOGIN_FAILED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}

