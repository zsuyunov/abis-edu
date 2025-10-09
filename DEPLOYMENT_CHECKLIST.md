# 🔐 Security Deployment Checklist

Print this checklist and check off each item as you complete it.

---

## Pre-Deployment (Before Making Changes)

- [ ] **Current system is fully backed up**
  - [ ] Database backup created
  - [ ] Code repository has latest commit
  - [ ] Environment variables documented

- [ ] **Maintenance window scheduled**
  - [ ] Users notified of upcoming maintenance
  - [ ] Expected downtime: 15-30 minutes
  - [ ] Rollback plan documented

- [ ] **Access verified**
  - [ ] Can access Render/Vercel dashboard
  - [ ] Can access database (Neon dashboard)
  - [ ] Can push to git repository

---

## Deployment Steps

### 1. Environment Variables ⚙️

- [ ] **JWT_SECRET generated**
  ```bash
  openssl rand -base64 64
  ```
  Output: `________________________` (save this)

- [ ] **REFRESH_TOKEN_SECRET generated** (MUST be different)
  ```bash
  openssl rand -base64 64
  ```
  Output: `________________________` (save this)

- [ ] **Added to Render environment variables**:
  - [ ] `JWT_SECRET`
  - [ ] `REFRESH_TOKEN_SECRET`
  - [ ] `ACCESS_TOKEN_EXPIRY = 15m`
  - [ ] `REFRESH_TOKEN_EXPIRY = 7d`
  - [ ] `NODE_ENV = production`

- [ ] **Environment variables saved** (clicked "Save Changes")

### 2. Code Deployment 📦

- [ ] **Dependencies installed locally**
  ```bash
  npm install argon2 speakeasy qrcode @types/qrcode crypto-js @types/crypto-js
  ```

- [ ] **Changes committed**
  ```bash
  git add .
  git commit -m "feat: implement production-grade security"
  ```

- [ ] **Pushed to git**
  ```bash
  git push origin main
  ```

- [ ] **Render auto-deploy started** (check Render dashboard)

- [ ] **Deployment logs reviewed** (no errors)

### 3. Database Migration 🗄️

- [ ] **Migration completed** (check Render logs for "prisma migrate deploy")

- [ ] **New tables verified**:
  ```sql
  SELECT COUNT(*) FROM "RefreshToken";
  SELECT COUNT(*) FROM "SecurityLog";
  ```
  - [ ] RefreshToken table exists
  - [ ] SecurityLog table exists

- [ ] **New columns verified**:
  ```sql
  SELECT "tokenVersion", "mfaEnabled", "failedLoginAttempts" 
  FROM "Admin" LIMIT 1;
  ```
  - [ ] tokenVersion column exists
  - [ ] mfaEnabled column exists
  - [ ] failedLoginAttempts column exists

### 4. Functionality Testing 🧪

- [ ] **Login endpoint works**
  ```bash
  curl -X POST https://your-app.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"phone":"TEST_PHONE","password":"TEST_PASSWORD"}'
  ```
  - [ ] Returns `accessToken`
  - [ ] Returns user object
  - [ ] Sets `auth_token` cookie
  - [ ] Sets `refresh_token` cookie

- [ ] **Refresh endpoint works**
  ```bash
  curl -X POST https://your-app.onrender.com/api/auth/refresh \
    -H "Cookie: refresh_token=YOUR_REFRESH_TOKEN"
  ```
  - [ ] Returns new `accessToken`
  - [ ] Updates cookies

- [ ] **Logout works**
  ```bash
  curl -X POST https://your-app.onrender.com/api/auth/logout \
    -H "Cookie: auth_token=YOUR_TOKEN"
  ```
  - [ ] Returns success
  - [ ] Clears cookies

- [ ] **User types can login**:
  - [ ] Admin can login
  - [ ] Teacher can login
  - [ ] Student can login
  - [ ] Parent can login
  - [ ] Staff (User table) can login

- [ ] **Rate limiting works**:
  - [ ] After 5 failed login attempts, receive 429 error
  - [ ] Error message: "Too many login attempts"
  - [ ] Lockout expires after 15 minutes

- [ ] **Account lockout works**:
  - [ ] After 5 failed password attempts, account locked
  - [ ] Error message includes lockout duration
  - [ ] Lockout expires after 30 minutes

### 5. Security Logging 📊

- [ ] **Login events logged**:
  ```sql
  SELECT * FROM "SecurityLog" 
  WHERE "eventType" = 'LOGIN_SUCCESS' 
  ORDER BY "createdAt" DESC LIMIT 5;
  ```
  - [ ] Logs contain userId, ipAddress, userAgent
  - [ ] Timestamps are correct

- [ ] **Failed login events logged**:
  ```sql
  SELECT * FROM "SecurityLog" 
  WHERE "eventType" = 'LOGIN_FAILED' 
  ORDER BY "createdAt" DESC LIMIT 5;
  ```
  - [ ] Failed attempts are tracked

- [ ] **Token refresh events logged**:
  ```sql
  SELECT * FROM "SecurityLog" 
  WHERE "eventType" = 'TOKEN_REFRESH' 
  ORDER BY "createdAt" DESC LIMIT 5;
  ```
  - [ ] Refresh operations are logged

### 6. MFA (Multi-Factor Authentication) 🔐

- [ ] **MFA setup endpoint works**:
  ```bash
  curl -X POST https://your-app.onrender.com/api/auth/mfa/setup \
    -H "Cookie: auth_token=ADMIN_OR_TEACHER_TOKEN"
  ```
  - [ ] Returns QR code URL
  - [ ] Returns secret

- [ ] **MFA verification works**:
  - [ ] Scan QR code with Google Authenticator
  - [ ] Enter 6-digit code
  - [ ] MFA enabled successfully

- [ ] **MFA login works**:
  - [ ] Login with phone + password
  - [ ] Receive `requiresMfa: true`
  - [ ] Submit MFA code
  - [ ] Receive tokens

- [ ] **MFA for admins enabled**:
  - [ ] Admin user #1: MFA enabled
  - [ ] Admin user #2: MFA enabled
  - [ ] (Continue for all admin accounts)

### 7. Password Reset 🔑

- [ ] **Password reset request works**:
  ```bash
  curl -X POST https://your-app.onrender.com/api/auth/password-reset/request \
    -H "Content-Type: application/json" \
    -d '{"phone":"TEST_PHONE"}'
  ```
  - [ ] Returns success message
  - [ ] Reset token generated (check dev mode response or database)

- [ ] **Password reset completion works**:
  ```bash
  curl -X POST https://your-app.onrender.com/api/auth/password-reset/complete \
    -H "Content-Type: application/json" \
    -d '{"token":"RESET_TOKEN","newPassword":"NewPass123","confirmPassword":"NewPass123"}'
  ```
  - [ ] Password updated successfully
  - [ ] tokenVersion incremented
  - [ ] All refresh tokens revoked
  - [ ] Can login with new password

### 8. Security Headers 🛡️

- [ ] **Check security headers** (use browser DevTools or curl):
  ```bash
  curl -I https://your-app.onrender.com
  ```
  - [ ] `Strict-Transport-Security` present
  - [ ] `Content-Security-Policy` present
  - [ ] `X-Frame-Options: DENY` present
  - [ ] `X-Content-Type-Options: nosniff` present
  - [ ] `X-XSS-Protection` present

---

## Post-Deployment Monitoring

### First 24 Hours

- [ ] **No critical errors in logs**
  - [ ] Check Render application logs
  - [ ] Check database logs

- [ ] **Users can login successfully**
  - [ ] Monitor `SecurityLog` for `LOGIN_SUCCESS` events
  - [ ] No unusual spike in `LOGIN_FAILED` events

- [ ] **Token refresh working**
  - [ ] Check `SecurityLog` for `TOKEN_REFRESH` events
  - [ ] No errors in application logs related to tokens

- [ ] **No legitimate users locked out**
  - [ ] Check `AccountLockedUntil` is null for active users:
    ```sql
    SELECT COUNT(*) FROM "Admin" WHERE "accountLockedUntil" IS NOT NULL;
    ```
  - [ ] If any locked, investigate why

### First Week

- [ ] **Review security logs daily**:
  ```sql
  SELECT "eventType", COUNT(*) 
  FROM "SecurityLog" 
  WHERE "createdAt" > NOW() - INTERVAL '24 hours'
  GROUP BY "eventType";
  ```

- [ ] **Check for suspicious patterns**:
  - [ ] Unusual spike in failed logins
  - [ ] Multiple accounts from same IP
  - [ ] Login attempts outside school hours

- [ ] **MFA adoption tracking**:
  ```sql
  SELECT 
    COUNT(CASE WHEN "mfaEnabled" = true THEN 1 END) as "mfa_enabled",
    COUNT(CASE WHEN "mfaEnabled" = false THEN 1 END) as "mfa_disabled"
  FROM "Admin";
  ```

- [ ] **Refresh token cleanup** (should happen automatically):
  ```sql
  DELETE FROM "RefreshToken" WHERE "expiresAt" < NOW();
  ```

### First Month

- [ ] **All admin accounts have MFA**:
  ```sql
  SELECT "phone", "firstName", "lastName", "mfaEnabled" 
  FROM "Admin" 
  WHERE "mfaEnabled" = false;
  ```
  - [ ] If any admins without MFA, enable it

- [ ] **Security log analysis**:
  - [ ] Failed login trends
  - [ ] Most common failure reasons
  - [ ] IP addresses with repeated failures

- [ ] **Performance check**:
  - [ ] Login speed acceptable (< 2 seconds)
  - [ ] Token refresh speed acceptable (< 1 second)
  - [ ] Rate limiting not blocking legitimate users

---

## Optional Enhancements

- [ ] **Cloudflare setup**
  - [ ] Domain added to Cloudflare
  - [ ] SSL/TLS enabled (Full Strict)
  - [ ] WAF rules enabled
  - [ ] Rate limiting at edge configured

- [ ] **Email provider integration**
  - [ ] SendGrid/Mailgun/AWS SES configured
  - [ ] Password reset emails working
  - [ ] Account lockout notifications working

- [ ] **SMS provider integration**
  - [ ] Twilio/AWS SNS configured
  - [ ] MFA codes via SMS working

- [ ] **Monitoring dashboard**
  - [ ] Security log viewer created
  - [ ] Real-time failed login alerts
  - [ ] Daily security report email

---

## Rollback Plan (If Needed)

If deployment fails:

- [ ] **Restore database from backup**
  ```bash
  # Via Neon: Restore from branch snapshot
  # Or: psql -h HOST -U USER -d DB < backup.sql
  ```

- [ ] **Revert code changes**
  ```bash
  git revert HEAD
  git push origin main
  ```

- [ ] **Clear environment variables** (optional)
  - Remove new environment variables from Render
  - Restart service

- [ ] **Notify users**
  - Send message about rollback
  - Provide new maintenance window

---

## Sign-Off

**Deployment completed by**: `_______________________`  
**Date**: `_______________________`  
**Time**: `_______________________`  

**Issues encountered**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Notes**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## ✅ Deployment Status

- [ ] **All checks passed**
- [ ] **System is production-ready**
- [ ] **Security hardening complete**

**Congratulations! Your school management system is now enterprise-secure.** 🎉🔒

