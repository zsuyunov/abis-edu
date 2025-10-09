-- ============================================================================
-- Security Hardening Migration - Manual SQL
-- Run this in Neon SQL Editor or via psql
-- ============================================================================
-- IMPORTANT: Backup your database before running this!
-- ============================================================================

-- Add security fields to Admin table
ALTER TABLE "Admin" 
ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT,
ADD COLUMN IF NOT EXISTS "lastPasswordChange" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "accountLockedUntil" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3);

-- Add unique constraint for passwordResetToken
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_passwordResetToken_key" ON "Admin"("passwordResetToken");

-- Add security fields to Teacher table
ALTER TABLE "Teacher"
ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT,
ADD COLUMN IF NOT EXISTS "lastPasswordChange" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "accountLockedUntil" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3);

-- Add unique constraint for passwordResetToken
CREATE UNIQUE INDEX IF NOT EXISTS "Teacher_passwordResetToken_key" ON "Teacher"("passwordResetToken");

-- Add security fields to Student table
ALTER TABLE "Student"
ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastPasswordChange" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "accountLockedUntil" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT;

-- Add security fields to Parent table
ALTER TABLE "Parent"
ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastPasswordChange" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "accountLockedUntil" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT;

-- Add security fields to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT,
ADD COLUMN IF NOT EXISTS "lastPasswordChange" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "accountLockedUntil" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3);

-- Add unique constraint for passwordResetToken
CREATE UNIQUE INDEX IF NOT EXISTS "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- Create SecurityEventType enum
DO $$ BEGIN
    CREATE TYPE "SecurityEventType" AS ENUM (
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'TOKEN_REFRESH',
        'PASSWORD_CHANGE',
        'PASSWORD_RESET_REQUEST',
        'PASSWORD_RESET_COMPLETE',
        'MFA_ENABLED',
        'MFA_DISABLED',
        'MFA_VERIFICATION_SUCCESS',
        'MFA_VERIFICATION_FAILED',
        'ACCOUNT_LOCKED',
        'ACCOUNT_UNLOCKED',
        'SUSPICIOUS_ACTIVITY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create SecurityEventStatus enum
DO $$ BEGIN
    CREATE TYPE "SecurityEventStatus" AS ENUM (
        'SUCCESS',
        'FAILURE',
        'WARNING'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create RefreshToken table
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "replacedBy" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- Create unique index on tokenHash
CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- Create indexes for RefreshToken
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_userRole_idx" ON "RefreshToken"("userId", "userRole");
CREATE INDEX IF NOT EXISTS "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- Create SecurityLog table
CREATE TABLE IF NOT EXISTS "SecurityLog" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "userRole" TEXT,
    "eventType" "SecurityEventType" NOT NULL,
    "eventStatus" "SecurityEventStatus" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- Create indexes for SecurityLog
CREATE INDEX IF NOT EXISTS "SecurityLog_userId_eventType_idx" ON "SecurityLog"("userId", "eventType");
CREATE INDEX IF NOT EXISTS "SecurityLog_eventType_createdAt_idx" ON "SecurityLog"("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "SecurityLog_eventStatus_createdAt_idx" ON "SecurityLog"("eventStatus", "createdAt");

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- You can now use the security features:
-- - Short-lived access tokens (15 min)
-- - Rotating refresh tokens
-- - MFA for admin/teacher accounts
-- - Account lockout after failed attempts
-- - Security event logging
-- ============================================================================

