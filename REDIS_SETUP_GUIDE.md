# Redis Setup Guide for Production

## Why Redis?

Your security system now supports Redis for distributed storage. This is **required** for:
- **Multi-instance deployments** (Render auto-scaling, load balancers)
- **Rate limiting** across multiple servers
- **CSRF protection** in distributed environments

Without Redis, each instance has its own memory, meaning:
- Rate limits are per-instance (5 instances = 25 login attempts before lockout)
- CSRF tokens work only on the instance that generated them

---

## Option 1: Upstash (Recommended - Free Tier)

### Why Upstash?
- ✅ Free tier: 10,000 commands/day (sufficient for small/medium schools)
- ✅ Serverless (pay-per-use, no idle costs)
- ✅ Global edge caching
- ✅ TLS/SSL included
- ✅ No credit card for free tier

### Setup Steps:

1. **Create Account**
   - Go to https://upstash.com/
   - Sign up with GitHub/Google/Email

2. **Create Database**
   - Click "Create Database"
   - Name: `school-management-prod`
   - Region: Choose closest to your app (e.g., `us-east-1` if on Render US)
   - Type: Regional (cheaper) or Global (faster)
   - Enable TLS: ✅

3. **Get Connection String**
   - After creation, click on your database
   - Copy the **Redis URL** (starts with `rediss://`)
   - Example: `rediss://default:YOUR_PASSWORD@YOUR_HOSTNAME.upstash.io:6379`

4. **Set Environment Variable**
   ```bash
   # In Render dashboard
   REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOSTNAME.upstash.io:6379
   ```

5. **Install Redis Client**
   ```bash
   npm install ioredis
   ```

6. **Uncomment Redis Code**
   - Open `src/lib/security/redis-adapter.ts`
   - Uncomment the `RedisStorage` class (lines ~80-130)
   - Uncomment the Redis import at the top
   - Uncomment the return statement in `getStorageAdapter()` (line ~145)

7. **Deploy and Test**
   ```bash
   git add .
   git commit -m "Enable Redis for production"
   git push
   ```

---

## Option 2: Railway (Free $5 Credit)

### Why Railway?
- ✅ $5 free credit (good for ~month)
- ✅ Full Redis server
- ✅ Easy to use
- ✅ Integrates well with Node.js

### Setup Steps:

1. **Create Account**
   - Go to https://railway.app/
   - Sign up with GitHub

2. **Create Redis Service**
   - New Project → Add Service → Database → Redis
   - Railway will automatically create a Redis instance

3. **Get Connection String**
   - Click on Redis service
   - Copy `REDIS_URL` from variables tab
   - Example: `redis://default:PASSWORD@monorail.proxy.rlwy.net:12345`

4. **Set Environment Variable & Continue**
   - Follow steps 4-7 from Upstash guide above

---

## Option 3: Render Redis (Paid - $7/month)

### Why Render Redis?
- ✅ Same platform as your app
- ✅ Private networking (faster)
- ✅ Automatic backups

### Setup Steps:

1. **Create Redis Instance**
   - Render Dashboard → New → Redis
   - Name: `school-redis`
   - Plan: Starter ($7/month)
   - Region: Same as your web service

2. **Get Connection String**
   - Copy Internal Redis URL (if same region) or External Redis URL
   - Example: `redis://red-xxxxx:6379`

3. **Set Environment Variable & Continue**
   - Follow steps 4-7 from Upstash guide above

---

## Option 4: Local Redis (Development Only)

### For testing on your local machine:

1. **Install Redis**
   ```bash
   # Windows (via WSL or Memurai)
   # Download: https://memurai.com/get-memurai

   # Mac
   brew install redis
   brew services start redis

   # Linux
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

2. **Set Environment Variable**
   ```bash
   # .env
   REDIS_URL=redis://localhost:6379
   ```

3. **Install ioredis & Enable Code**
   - Follow steps 5-6 from Upstash guide above

---

## Verification

After setting up Redis, verify it works:

1. **Check Logs**
   ```
   ✅ Redis connected successfully
   🚀 Using Redis for distributed storage
   ```

2. **Test Rate Limiting**
   - Try to login 6 times rapidly
   - Should see 429 error after 5 attempts
   - Verify this works even after server restart

3. **Monitor Redis**
   ```bash
   # In Upstash dashboard: View "Commands" graph
   # Should see activity after login attempts
   ```

---

## Cost Comparison

| Provider | Free Tier | Paid Plan | Best For |
|----------|-----------|-----------|----------|
| **Upstash** | 10K cmds/day | $0.20/100K cmds | Serverless, low traffic |
| **Railway** | $5 credit | ~$5-10/month | Simple setup, predictable cost |
| **Render** | None | $7/month | Same platform, private network |
| **Local** | Free | Free | Development only |

**Recommendation**: Start with **Upstash free tier** (10K commands = ~1,000 logins/day).

---

## Troubleshooting

### "Redis connection error: ECONNREFUSED"
- **Cause**: Redis URL is incorrect or Redis is not running
- **Solution**: Verify `REDIS_URL` format and Redis service status

### "Using in-memory storage" despite REDIS_URL set
- **Cause**: Redis code not uncommented or `ioredis` not installed
- **Solution**: Uncomment `RedisStorage` in `redis-adapter.ts` and run `npm install ioredis`

### "Redis connection timeout"
- **Cause**: Firewall or network issue
- **Solution**: Check if Redis port (6379) is accessible, verify TLS settings

### "Too many connections to Redis"
- **Cause**: Not reusing Redis client (connection pool exhausted)
- **Solution**: Code already handles this via singleton pattern in `getStorage()`

---

## Monitoring

### Upstash Dashboard
- Commands per second
- Data size
- Latency

### Watch for:
- Spike in failed commands (connection issues)
- High latency (>50ms might indicate region mismatch)
- Memory usage (unlikely to hit limits with security use case)

---

## Without Redis (Single Instance Only)

If you deploy **only one instance** on Render (no auto-scaling), you can skip Redis for now:
- In-memory storage works fine for single instance
- Rate limiting works correctly
- CSRF protection works correctly

**However**, if Render restarts your instance:
- Rate limit counters reset
- CSRF tokens invalidated (users need to refresh)

**Recommendation**: Set up Redis even for single instance for better reliability.

---

## Next Steps

1. Choose a Redis provider (Upstash recommended)
2. Set `REDIS_URL` in environment
3. Install `ioredis`: `npm install ioredis`
4. Uncomment Redis code in `redis-adapter.ts`
5. Deploy and verify logs show "Redis connected successfully"
6. Test rate limiting works across restarts

---

*Questions? Check the troubleshooting section or open an issue.*

