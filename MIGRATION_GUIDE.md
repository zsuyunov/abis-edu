# Security Hardening - Migration Guide

## ⚠️ IMPORTANT - READ BEFORE DEPLOYING

This guide will walk you through applying the security hardening changes to your production system.

## Pre-Migration Checklist

- [ ] **Backup your database** - This is CRITICAL!
- [ ] Read this entire guide before starting
- [ ] Schedule maintenance window (expect 15-30 minutes downtime)
- [ ] Notify users about the upcoming maintenance
- [ ] Have rollback plan ready

## Step 1: Backup Database

```bash
# For Neon/PostgreSQL, create a backup
# Via Neon Dashboard: Branches > Create branch (snapshot)
# Or use pg_dump if you have direct access:
pg_dump -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE > backup_before_security_$(date +%Y%m%d).sql
```

## Step 2: Update Environment Variables

### Required New Variables

Add these to your deployment platform (Render, Vercel, etc.):

```bash
# Generate secrets (run on your local machine):
openssl rand -base64 64  # Use for JWT_SECRET
openssl rand -base64 64  # Use for REFRESH_TOKEN_SECRET (MUST be different!)

# Add to Render/Vercel environment:
JWT_SECRET="your_generated_secret_here"
REFRESH_TOKEN_SECRET="your_different_secret_here"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"
```

### ⚠️ CRITICAL: JWT_SECRET
If you already have a `JWT_SECRET`:
- Option A: Keep it as `JWT_SECRET` for backward compatibility during transition
- Option B: Generate new one and force all users to re-login (more secure)
- **MUST** add `REFRESH_TOKEN_SECRET` as a separate, different secret

## Step 3: Install Dependencies

```bash
cd full-stack-school
npm install argon2 express-rate-limit helmet speakeasy qrcode @types/qrcode crypto-js @types/crypto-js
```

## Step 4: Generate Migration

```bash
# Generate the migration file
npx prisma migrate dev --name security_hardening

# This will create a migration in prisma/migrations/
```

**Review the migration file** before applying to production!

## Step 5: Apply to Production

### Option A: Automatic Deploy (Render)

If you push to git and Render auto-deploys:

```bash
# Commit changes
git add .
git commit -m "feat: implement production-grade security hardening"
git push origin main

# Render will:
# 1. Build the app
# 2. Run: npx prisma migrate deploy
# 3. Restart the server
```

### Option B: Manual Deploy

```bash
# SSH into your server or use Render shell
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Restart your application
pm2 restart all  # or whatever process manager you use
```

## Step 6: Migrate Existing Passwords

All existing passwords need to be rehashed from bcrypt to Argon2.

**Two approaches:**

### Approach A: Lazy Migration (Recommended)

Passwords are rehashed on next login. No action needed.

The old `AuthService.verifyPassword()` still works because it's now a wrapper around the new `PasswordService.verify()`, which automatically handles bcrypt hashes.

**No user action required** - they'll be migrated on next login.

### Approach B: Force Password Reset (More Secure)

Force all users to reset passwords:

```bash
# Run this script to invalidate all sessions
npx prisma db execute --stdin < force_password_reset.sql
```

Create `force_password_reset.sql`:
```sql
-- Increment tokenVersion for all users to invalidate sessions
UPDATE "Admin" SET "tokenVersion" = "tokenVersion" + 1;
UPDATE "Teacher" SET "tokenVersion" = "tokenVersion" + 1;
UPDATE "Student" SET "tokenVersion" = "tokenVersion" + 1;
UPDATE "Parent" SET "tokenVersion" = "tokenVersion" + 1;
UPDATE "User" SET "tokenVersion" = "tokenVersion" + 1;

-- Optional: Set a flag that forces password reset on next login
-- (You'll need to implement this UI flow)
```

## Step 7: Verify Migration

### Test Authentication

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"912345678","password":"test"}'

# Should return:
# - accessToken
# - user object
# - Cookies: auth_token, refresh_token
```

### Test Token Refresh

```bash
# Extract refresh_token cookie from login response
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: refresh_token=YOUR_REFRESH_TOKEN"

# Should return new accessToken
```

### Test Security Logging

```sql
-- Check if logs are being created
SELECT * FROM "SecurityLog" ORDER BY "createdAt" DESC LIMIT 10;
```

### Test MFA (Admin/Teacher accounts)

```bash
# Setup MFA
curl -X POST http://localhost:3000/api/auth/mfa/setup \
  -H "Cookie: auth_token=YOUR_ACCESS_TOKEN"

# Should return QR code URL
```

## Step 8: Monitor After Deploy

### First 24 Hours

- [ ] Check for failed logins in `SecurityLog` table
- [ ] Verify users can login successfully
- [ ] Check error logs for auth-related errors
- [ ] Monitor rate limiting (check if legitimate users are blocked)
- [ ] Verify token refresh is working

### SQL Queries for Monitoring

```sql
-- Failed logins in last hour
SELECT * FROM "SecurityLog" 
WHERE "eventType" = 'LOGIN_FAILED' 
  AND "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;

-- Account lockouts
SELECT * FROM "SecurityLog" 
WHERE "eventType" = 'ACCOUNT_LOCKED'
ORDER BY "createdAt" DESC;

-- Active refresh tokens
SELECT COUNT(*), "userRole" 
FROM "RefreshToken" 
WHERE "revokedAt" IS NULL 
  AND "expiresAt" > NOW()
GROUP BY "userRole";

-- Users with failed login attempts
SELECT s."studentId", s."firstName", s."lastName", s."failedLoginAttempts", s."accountLockedUntil"
FROM "Student" s
WHERE s."failedLoginAttempts" > 0;
```

## Step 9: Enable MFA for Critical Accounts

After migration, enable MFA for:

1. **All Admin accounts** (highest priority)
2. **Director accounts** (User table positions)
3. **Teacher accounts** (optional but recommended)

Email or notify these users with instructions:
```
Subject: Enable Two-Factor Authentication

Dear [Name],

As part of our security upgrade, we now support Two-Factor Authentication (2FA).

To enable:
1. Login to your account
2. Go to Settings > Security
3. Click "Enable MFA"
4. Scan QR code with Google Authenticator or Authy
5. Enter verification code

This adds an extra layer of security to your account.

Thank you,
IT Team
```

## Troubleshooting

### Issue: Users can't login after migration

**Cause**: Environment variables not set correctly

**Solution**:
```bash
# Check if secrets are set
echo $JWT_SECRET
echo $REFRESH_TOKEN_SECRET

# If empty, add them to .env or deployment platform
```

### Issue: "Invalid token" errors everywhere

**Cause**: JWT_SECRET changed, all existing tokens are invalid

**Solution**: This is expected if you changed JWT_SECRET. Users need to re-login.

### Issue: Migration fails with "column already exists"

**Cause**: Migration was partially applied

**Solution**:
```bash
# Mark migration as applied
npx prisma migrate resolve --applied security_hardening

# Or rollback and retry
npx prisma migrate resolve --rolled-back security_hardening
npx prisma migrate deploy
```

### Issue: Argon2 installation fails

**Cause**: Argon2 requires native compilation

**Solution**:
```bash
# Install build tools (Linux)
apt-get install python3 make g++

# Install build tools (macOS)
xcode-select --install

# Windows: Install Visual Studio Build Tools
```

### Issue: Rate limiting blocking legitimate users

**Cause**: Shared IP addresses (e.g., school network)

**Solution**: Adjust rate limits in `/src/lib/security/rate-limit.ts`:
```typescript
export const RateLimitPresets = {
  LOGIN: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,  // Increase from 5 to 10
    message: '...',
  },
  // ...
};
```

## Rollback Plan

If you need to rollback:

### 1. Restore Database Backup

```bash
# Restore from Neon branch
# Or restore from pg_dump:
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE < backup_before_security_20250108.sql
```

### 2. Revert Code

```bash
git revert HEAD
git push origin main
```

### 3. Rollback Migration

```bash
npx prisma migrate resolve --rolled-back security_hardening
```

## Post-Migration Tasks

### Week 1
- [ ] Monitor security logs daily
- [ ] Check for unusual patterns
- [ ] Verify all user roles can access their dashboards
- [ ] Test password reset flow end-to-end

### Week 2
- [ ] Enable MFA for all admins
- [ ] Review and adjust rate limits if needed
- [ ] Set up automated security log monitoring
- [ ] Create admin dashboard for viewing security events

### Month 1
- [ ] Review MFA adoption rate
- [ ] Analyze security logs for trends
- [ ] Clean up old refresh tokens (should be automatic)
- [ ] Update documentation with any findings

## Next Steps

After successful migration:

1. **Update Frontend** (if needed):
   - Implement MFA UI components
   - Add token refresh logic
   - Handle account lockout messages
   - Add password strength indicator

2. **Set up Monitoring**:
   - Create dashboard for security events
   - Set up alerts for suspicious activity
   - Monitor rate limit hits

3. **Configure Email/SMS** (for password reset):
   - Integrate SendGrid/Twilio
   - Update environment variables
   - Test password reset flow

4. **Add Cloudflare** (optional but recommended):
   - Add your domain to Cloudflare
   - Enable WAF rules
   - Configure rate limiting at edge
   - Enable DDoS protection

## Support

If you encounter issues during migration:

1. Check the logs: `/var/log/your-app.log`
2. Review `SecurityLog` table for clues
3. Check Render/Vercel deployment logs
4. Verify all environment variables are set
5. Test with a single user account first

---

**Remember**: Security is an ongoing process, not a one-time setup. Keep monitoring and improving!

