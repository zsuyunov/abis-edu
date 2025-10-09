# Redis vs Postgres: Data Storage Strategy

## ⚠️ Critical: Where to Store What

You're using **Upstash Redis (pay-as-you-go with eviction enabled)** and **Neon Postgres**. It's crucial to use the right database for the right data.

---

## ✅ USE REDIS FOR (Temporary/Ephemeral Data)

### 1. Rate Limiting Counters
- **Why**: Short-lived (15 min - 1 hour windows)
- **Impact if lost**: User can try again, no data loss
- **Current**: ✅ Already using Redis
- **Files**: `src/lib/security/rate-limit.ts`

### 2. CSRF Tokens
- **Why**: Expires after 1 hour
- **Impact if lost**: User refreshes page and gets new token
- **Current**: ✅ Already using Redis
- **Files**: `src/lib/security/csrf.ts`

### 3. Session Cache (Optional)
- **Why**: Can be rebuilt from database
- **Impact if lost**: User has to re-authenticate (minor inconvenience)
- **Current**: ❌ Not implemented
- **Note**: Access tokens are in JWT (stateless), refresh tokens are in Postgres

### 4. Temporary Locks/Flags
- **Why**: Short-lived coordination
- **Impact if lost**: Lock is released, operation retries
- **Current**: ❌ Not needed yet

---

## ✅ USE POSTGRES FOR (Permanent/Critical Data)

### 1. Refresh Tokens ⭐ CRITICAL
- **Why**: Must persist until explicitly revoked
- **Impact if lost**: All users logged out unexpectedly
- **Current**: ✅ Already in Postgres (`RefreshToken` table)
- **Files**: `src/lib/security/tokens.ts`
- **Table**: `RefreshToken` (with `tokenHash`, `expiresAt`, `revokedAt`)

### 2. Security Logs ⭐ CRITICAL
- **Why**: Permanent audit trail for compliance
- **Impact if lost**: Lost forensics, cannot investigate attacks
- **Current**: ✅ Already in Postgres (`SecurityLog` table)
- **Files**: `src/lib/security/logger.ts`
- **Table**: `SecurityLog` (login attempts, suspicious activity)

### 3. User Accounts ⭐ CRITICAL
- **Why**: Core system data
- **Impact if lost**: Catastrophic
- **Current**: ✅ Already in Postgres (`Admin`, `Teacher`, `Student`, etc.)
- **Tables**: `Admin`, `Teacher`, `Student`, `Parent`, `User`

### 4. MFA Secrets (When Enabled) ⭐ CRITICAL
- **Why**: Cannot be regenerated without user action
- **Impact if lost**: Users locked out of accounts
- **Current**: ✅ Schema ready in Postgres
- **Fields**: `mfaSecret`, `mfaEnabled` in user tables

### 5. Backup Codes (When MFA Enabled) ⭐ CRITICAL
- **Why**: Recovery mechanism if phone lost
- **Impact if lost**: Users permanently locked out
- **Current**: 🟡 Not implemented yet (will be in Postgres)
- **Recommendation**: Store hashed in user table or separate `BackupCodes` table

---

## 🎯 Your Current Setup (Correct!)

| Data Type | Storage | Status | Notes |
|-----------|---------|--------|-------|
| Rate limits | Redis | ✅ Correct | Ephemeral, safe to lose |
| CSRF tokens | Redis | ✅ Correct | Expires after 1 hour |
| Refresh tokens | Postgres | ✅ Correct | Must persist |
| Security logs | Postgres | ✅ Correct | Permanent audit trail |
| User data | Postgres | ✅ Correct | Core system data |
| Access tokens | JWT (stateless) | ✅ Correct | No storage needed |

**Verdict**: Your architecture is correctly designed! ✅

---

## 🔍 How Eviction Works (Upstash)

When you enable eviction on Upstash:

1. **Memory Limit Reached**: Upstash starts removing keys
2. **Eviction Policy**: You should use `volatile-lru` or `allkeys-lru`
   - `volatile-lru`: Evicts keys with TTL (our rate limits & CSRF tokens have TTL)
   - `allkeys-lru`: Evicts any key (more aggressive)
3. **What Gets Evicted**: Least recently used keys

**Our data**:
- Rate limits: Have TTL ✅ Will be evicted when expired or under pressure
- CSRF tokens: Have TTL ✅ Will be evicted when expired or under pressure

**This is PERFECT** for our use case because:
- If rate limit counter is evicted → User can try again (no harm)
- If CSRF token is evicted → User refreshes page (minor inconvenience)

---

## 💰 Cost Optimization Tips

### Upstash (Pay-as-you-go)
```
Free tier: 10,000 commands/day
Paid: ~$0.20 per 100,000 commands
```

**Our usage**:
- Each login: ~4 Redis commands (rate limit check + set)
- Each CSRF: ~2 Redis commands (generate + verify)
- **Estimate**: 1,000 logins/day = ~4,000 commands = FREE tier

**Cost savings**:
1. ✅ Use TTL on all keys (auto-expiry, no manual cleanup needed)
2. ✅ Use Postgres for permanent data (much cheaper at rest)
3. ✅ Enable eviction (prevents memory overload)

### Neon (Serverless Postgres)
```
Free tier: 0.5 GB storage, 191.9 hours compute/month
Paid: $0.16/GB-month storage, $0.16/hour compute
```

**Our usage**:
- Security logs: ~1 KB per login
- Refresh tokens: ~500 bytes each
- **Estimate**: 10,000 users + 1 year logs = ~50 MB = FREE tier

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T Store These in Redis:
- ❌ User passwords (even hashed)
- ❌ Refresh tokens
- ❌ Security audit logs
- ❌ MFA secrets
- ❌ Any data you can't afford to lose

### ❌ DON'T Store These in Postgres:
- ❌ Rate limit counters (too many writes, expensive)
- ❌ Temporary session cache (use Redis or JWT)
- ❌ CSRF tokens (too short-lived)

---

## 📊 Performance Comparison

| Operation | Redis | Postgres | Winner |
|-----------|-------|----------|--------|
| Rate limit check | 1-2ms | 10-20ms | Redis |
| CSRF verify | 1-2ms | 10-20ms | Redis |
| Get refresh token | 5-10ms | 5-10ms | Tie (both fast with index) |
| Log security event | N/A | 10-20ms | Postgres (must persist) |
| Complex queries | N/A | Fast with indexes | Postgres |

**Rule of thumb**:
- **Hot path** (called every request): Redis if ephemeral
- **Cold path** (called occasionally): Postgres
- **Permanent data**: Always Postgres

---

## 🔧 Monitoring Your Redis

### Check Upstash Dashboard:
1. **Commands/second**: Should be low (< 10/sec for small school)
2. **Memory usage**: Should be under 10 MB
3. **Evictions**: Occasional evictions are FINE for our use case
4. **Hit rate**: Not critical for our use case (we always set TTL)

### Red Flags:
- 🚨 Constant evictions with memory < 50% → Check for key leaks
- 🚨 Memory growing unbounded → Missing TTL on some keys
- 🚨 High latency (>100ms) → Region mismatch with your app

---

## ✅ Configuration Checklist

### Upstash Redis:
- [x] Eviction policy: `volatile-lru` or `allkeys-lru`
- [x] Region: Same as Render deployment (for low latency)
- [x] TLS: Enabled
- [x] Max memory: Default (128 MB free tier is plenty)

### Neon Postgres:
- [x] Connection pooling: Enabled
- [x] SSL: Required
- [x] Backups: Enabled (daily)
- [x] Region: Same as Render deployment

---

## 🎉 Summary

**Your current setup is CORRECT!** ✅

- Redis (Upstash): Rate limits + CSRF tokens (temporary)
- Postgres (Neon): Everything else (permanent)

**No changes needed** to your architecture. You're following best practices:
1. ✅ Using Redis for hot path, ephemeral data
2. ✅ Using Postgres for cold path, permanent data
3. ✅ Setting TTL on all Redis keys
4. ✅ Using eviction policy safely

**Cost**: Both services should stay within free tier for small-medium school (< 1,000 students).

---

## 📚 References

- [Upstash Best Practices](https://upstash.com/docs/redis/overall/bestpractices)
- [Redis Eviction Policies](https://redis.io/docs/manual/eviction/)
- [Neon Pricing Calculator](https://neon.tech/pricing)

---

*Need help? Check the monitoring section or open an issue.*

