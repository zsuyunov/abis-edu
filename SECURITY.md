# Security Implementation Guide

## Overview

This school management system has been hardened with production-grade security following OWASP Top-10 best practices. This document explains the security features and how to use them.

## Security Features Implemented

### 1. Authentication & Token Security ✅

#### Short-lived Access Tokens
- **Duration**: 15 minutes (configurable via `ACCESS_TOKEN_EXPIRY`)
- **Storage**: httpOnly cookie `auth_token`
- **Purpose**: Used for API authentication
- **Algorithm**: JWT with RS256 or HS256

#### Rotating Refresh Tokens
- **Duration**: 7 days (configurable via `REFRESH_TOKEN_EXPIRY`)
- **Storage**: 
  - httpOnly cookie `refresh_token`
  - Hashed (SHA-256) in database `RefreshToken` table
- **Rotation**: New refresh token issued on every use, old token revoked
- **Revocation**: Automatic on logout, password change, or security events

#### Token Versioning
- **Field**: `tokenVersion` on all user tables
- **Purpose**: Global token invalidation
- **Usage**: Incremented on password change, logout all devices
- **Effect**: Invalidates all existing tokens immediately

### 2. Password Security ✅

#### Argon2id Hashing
- **Algorithm**: Argon2id (winner of Password Hashing Competition)
- **Parameters**:
  - Memory: 64 MB
  - Iterations: 3
  - Parallelism: 4 threads
- **Superior to**: bcrypt, scrypt, PBKDF2

#### Password Requirements
- Minimum length: 8 characters
- Maximum length: 128 characters
- Additional complexity rules can be added in `PasswordService.validatePasswordStrength()`

#### Password Reset Flow
1. User requests reset via `/api/auth/password-reset/request`
2. Server generates secure 32-byte token (64 hex chars)
3. Token expires after 1 hour
4. User submits new password via `/api/auth/password-reset/complete`
5. On success:
   - Password is hashed with Argon2
   - `tokenVersion` is incremented (invalidates all sessions)
   - All refresh tokens are revoked
   - Failed login attempts are reset

### 3. Multi-Factor Authentication (MFA) ✅

#### TOTP Implementation
- **Algorithm**: RFC 6238 Time-based One-Time Password
- **Compatible**: Google Authenticator, Authy, Microsoft Authenticator
- **Availability**: Admin and Teacher accounts only
- **Secret length**: 32 characters (base32)

#### MFA Setup Flow
1. `POST /api/auth/mfa/setup` - Generate QR code
2. User scans QR code with authenticator app
3. `PUT /api/auth/mfa/setup` - Verify with 6-digit code
4. MFA is enabled, `mfaSecret` stored encrypted

#### MFA Login Flow
1. User enters phone + password
2. If MFA enabled, server responds with `requiresMfa: true`
3. User submits 6-digit code
4. Server verifies code with `window: 2` (allows clock skew)
5. On success, issue tokens

#### Disabling MFA
- Requires current password AND valid MFA code
- `DELETE /api/auth/mfa/setup`

### 4. Rate Limiting ✅

#### Implemented Presets

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| Login | 5 attempts | 15 minutes | Prevent brute force |
| Password Reset | 3 attempts | 1 hour | Prevent abuse |
| MFA Verification | 5 attempts | 5 minutes | Prevent code guessing |
| General API | 100 requests | 1 minute | Prevent DoS |

#### Implementation
- **Storage**: In-memory Map (suitable for single instance)
- **Recommended**: Use Redis for multi-instance deployments
- **Cleanup**: Automatic every 5 minutes

### 5. Account Lockout ✅

#### Configuration
- **Max Failed Attempts**: 5 (default)
- **Lockout Duration**: 30 minutes (default)
- **Behavior**:
  - Failed login increments `failedLoginAttempts`
  - After 5 failures, `accountLockedUntil` is set
  - Lockout automatically expires after 30 minutes
  - Successful login resets counter
  - Password reset also resets counter and unlocks account

### 6. Security Event Logging ✅

#### Logged Events
- `LOGIN_SUCCESS` - Successful authentication
- `LOGIN_FAILED` - Failed login attempt
- `LOGOUT` - User logout
- `TOKEN_REFRESH` - Token rotation
- `PASSWORD_CHANGE` - Password updated
- `PASSWORD_RESET_REQUEST` - Reset requested
- `PASSWORD_RESET_COMPLETE` - Reset completed
- `MFA_ENABLED` / `MFA_DISABLED` - MFA changes
- `MFA_VERIFICATION_SUCCESS` / `FAILED` - MFA attempts
- `ACCOUNT_LOCKED` / `UNLOCKED` - Account lock events
- `SUSPICIOUS_ACTIVITY` - Anomalies detected

#### Log Fields
- `userId`, `userRole`
- `eventType`, `eventStatus`
- `ipAddress`, `userAgent`
- `details`, `metadata` (JSON)
- `createdAt`

#### Querying Logs
```typescript
// Get user's security events
const logs = await SecurityLogger.getUserLogs(userId, userRole, 50);

// Get recent failed logins (for monitoring)
const failures = await SecurityLogger.getRecentFailedLogins(100);
```

### 7. Security Headers ✅

Applied to all responses via middleware:

- **Content-Security-Policy**: Prevents XSS attacks
- **Strict-Transport-Security**: Forces HTTPS (HSTS)
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Browser XSS filter
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### 8. Input Validation ✅

#### Zod Schemas
All authentication endpoints validate input with Zod:

- `loginSchema` - Login credentials
- `refreshTokenSchema` - Token refresh
- `passwordChangeSchema` - Password change
- `passwordResetRequestSchema` - Reset request
- `passwordResetCompleteSchema` - Reset completion
- `mfaSetupSchema`, `mfaVerifySchema` - MFA operations

#### Sanitization
- HTML tags stripped
- JavaScript protocols removed
- Event handlers blocked
- Whitespace trimmed

### 9. CSRF Protection ✅

#### Implementation
- Token-based protection for state-changing operations
- Tokens in `x-csrf-token` header
- SameSite=Strict cookies
- Automatic cleanup of expired tokens

### 10. Database Security

#### Schema Changes
All user tables now include:
```prisma
tokenVersion          Int       @default(0)
mfaEnabled            Boolean   @default(false)
mfaSecret             String?
lastPasswordChange    DateTime?
failedLoginAttempts   Int       @default(0)
accountLockedUntil    DateTime?
lastLoginAt           DateTime?
lastLoginIp           String?
passwordResetToken    String?   @unique
passwordResetExpires  DateTime?
```

#### New Tables
- `RefreshToken` - Stores hashed refresh tokens
- `SecurityLog` - Audit trail of security events

## Deployment Guide

### 1. Environment Setup

```bash
# Copy example env file
cp .env.example .env

# Generate strong secrets (64 characters)
openssl rand -base64 64  # Use for JWT_SECRET
openssl rand -base64 64  # Use for REFRESH_TOKEN_SECRET (MUST be different!)

# Update .env with actual values
nano .env
```

### 2. Database Migration

```bash
# Generate migration
npx prisma migrate dev --name security_hardening

# Deploy to production
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 3. Production Checklist

- [ ] Strong, unique secrets in environment variables
- [ ] `NODE_ENV=production`
- [ ] Database user has minimal permissions (not superuser)
- [ ] SSL/TLS enabled for database connections
- [ ] HTTPS enforced (Let's Encrypt, Cloudflare)
- [ ] Email/SMS providers configured
- [ ] Rate limiting tested
- [ ] MFA tested for admin accounts
- [ ] Security logs monitored
- [ ] Backups configured
- [ ] Firewall rules configured (only allow necessary ports)

### 4. Recommended: Add Cloudflare

Add Cloudflare in front of your deployment for:
- DDoS protection
- Additional rate limiting
- Web Application Firewall (WAF)
- SSL/TLS termination
- Bot protection

## API Usage Examples

### Login with MFA
```typescript
// Step 1: Initial login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '912345678', password: 'SecurePass123' })
});

// If MFA required
if (response.requiresMfa) {
  // Step 2: Submit MFA code
  const mfaResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '912345678',
      password: 'SecurePass123',
      mfaCode: '123456'
    })
  });
}
```

### Token Refresh
```typescript
// Frontend: Automatically refresh before expiry
const refreshToken = async () => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include'  // Include httpOnly cookies
  });
  
  if (response.ok) {
    // New tokens are automatically set in cookies
    return response.json();
  } else {
    // Refresh failed, redirect to login
    window.location.href = '/login';
  }
};

// Check for X-Token-Refresh-Suggested header
if (response.headers.get('X-Token-Refresh-Suggested')) {
  await refreshToken();
}
```

### Enable MFA
```typescript
// Step 1: Get QR code
const setupResponse = await fetch('/api/auth/mfa/setup', {
  method: 'POST',
  credentials: 'include'
});
const { qrCodeUrl, secret } = await setupResponse.json();

// Display QR code to user
// User scans with authenticator app

// Step 2: Verify with code from app
const verifyResponse = await fetch('/api/auth/mfa/setup', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: '123456', secret }),
  credentials: 'include'
});
```

### Password Reset
```typescript
// Step 1: Request reset
await fetch('/api/auth/password-reset/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '912345678' })
});

// Step 2: User receives token (email/SMS in production)
// Complete reset
await fetch('/api/auth/password-reset/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'reset_token_here',
    newPassword: 'NewSecurePass123',
    confirmPassword: 'NewSecurePass123'
  })
});
```

## Monitoring & Maintenance

### Daily Tasks
- Review `SecurityLog` for suspicious patterns
- Check for unusual failed login spikes
- Monitor rate limit hits

### Weekly Tasks
- Review MFA enrollment rates
- Check password reset requests
- Analyze account lockouts

### Monthly Tasks
- Rotate JWT secrets (requires user re-login)
- Review and update security policies
- Test disaster recovery

### Database Cleanup
```typescript
// Clean up expired refresh tokens (run daily via cron)
import { TokenService } from '@/lib/security';
await TokenService.cleanupExpiredTokens();

// Archive old security logs (run monthly)
await prisma.securityLog.deleteMany({
  where: {
    createdAt: {
      lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days
    }
  }
});
```

## Incident Response

### Suspected Account Compromise
1. Immediately increment user's `tokenVersion`
2. Revoke all refresh tokens
3. Lock account temporarily
4. Notify user via email/SMS
5. Require password reset
6. Review security logs for IP addresses

### Suspected Token Theft
1. Check `SecurityLog` for anomalies
2. Look for tokens used from multiple IPs
3. Increment `tokenVersion` for affected users
4. Force re-authentication

### Brute Force Attack Detected
1. Review failed login patterns in `SecurityLog`
2. Identify attacking IP addresses
3. Add to blocklist at firewall/Cloudflare level
4. Notify affected users if accounts locked

## Support & Questions

For security concerns or questions:
1. Review this documentation
2. Check `/src/lib/security/` implementations
3. Consult OWASP guidelines
4. Contact system administrator

## License & Attribution

Security implementation based on:
- OWASP Top 10 (2021)
- NIST SP 800-63B Digital Identity Guidelines
- RFC 6238 (TOTP)
- RFC 7519 (JWT)
- Argon2 RFC 9106

