/**
 * Redis Adapter for Distributed Storage
 * PRODUCTION-READY: Supports Redis for multi-instance deployments
 * Falls back to in-memory storage for development
 * 
 * ⚠️ IMPORTANT: Data Storage Strategy
 * =======================================
 * 
 * USE REDIS (Upstash with eviction enabled) FOR:
 * ✅ Rate limiting counters (temporary, expires after window)
 * ✅ CSRF tokens (temporary, expires after 1 hour)
 * ✅ Session cache (optional, expires)
 * ✅ Temporary locks/flags
 * ✅ Any data that can be regenerated or safely lost
 * 
 * USE POSTGRES (Neon DB) FOR:
 * ✅ Refresh tokens (permanent until revoked)
 * ✅ Security logs (permanent audit trail)
 * ✅ User data (permanent)
 * ✅ MFA secrets (permanent, encrypted)
 * ✅ Backup codes (permanent, hashed)
 * ✅ Any data that MUST persist
 * 
 * Why? Upstash pay-as-you-go with eviction can drop data under memory pressure.
 * Redis is perfect for ephemeral data, but use Postgres for anything critical.
 * 
 * Setup for production:
 * 1. Install Redis client: npm install ioredis
 * 2. Set REDIS_URL in .env (Upstash free tier)
 * 3. Enable eviction policy in Upstash: allkeys-lru or volatile-lru
 */

import Redis from 'ioredis';

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, expiresIn?: number): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  ttl(key: string): Promise<number>;
}

/**
 * In-Memory Storage (for development only)
 * WARNING: Not suitable for production with multiple instances
 */
class MemoryStorage implements StorageAdapter {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string, expiresInSeconds?: number): Promise<void> {
    const expiresAt = expiresInSeconds 
      ? Date.now() + expiresInSeconds * 1000 
      : undefined;
    
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching (basic glob support)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item || !item.expiresAt) return -1;
    
    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  // Cleanup expired entries periodically
  startCleanup(intervalMs = 60000) {
    setInterval(() => {
      const now = Date.now();
      // Convert iterator to array to avoid TypeScript downlevelIteration error
      for (const [key, item] of Array.from(this.store.entries())) {
        if (item.expiresAt && now > item.expiresAt) {
          this.store.delete(key);
        }
      }
    }, intervalMs);
  }
}

/**
 * Redis Storage with Resilient Fallback (for production)
 * Automatically falls back to in-memory storage if Redis is unavailable
 * This ensures the app continues to work even if Redis is down
 */

class ResilientRedisStorage implements StorageAdapter {
  private client: Redis;
  private fallback: MemoryStorage;
  private isRedisHealthy: boolean = true;
  private lastHealthCheck: number = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  constructor(redisUrl: string) {
    // Initialize fallback storage immediately
    this.fallback = new MemoryStorage();
    this.fallback.startCleanup();

    // Initialize Redis with fast-fail configuration
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 2, // Reduced retries
      connectTimeout: 5000, // 5 second timeout
      commandTimeout: 3000, // 3 second command timeout
      enableReadyCheck: false, // Don't wait for ready
      lazyConnect: true, // Don't connect immediately
      retryStrategy(times) {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 1000); // Fast retry with max 1s delay
      },
    });

    // Handle connection errors gracefully
    this.client.on('error', (error) => {
      if (this.isRedisHealthy) {
        console.warn('⚠️ Redis connection lost, falling back to in-memory storage');
        console.warn('   Error:', error.message);
        this.isRedisHealthy = false;
      }
    });

    this.client.on('connect', () => {
      if (!this.isRedisHealthy) {
        console.log('✅ Redis connection restored');
      }
      this.isRedisHealthy = true;
    });

    this.client.on('ready', () => {
      this.isRedisHealthy = true;
      console.log('✅ Redis is ready and healthy');
    });

    // Attempt initial connection (non-blocking)
    this.client.connect().catch(err => {
      console.warn('⚠️ Initial Redis connection failed, using in-memory storage');
      console.warn('   The app will automatically retry connecting to Redis');
      this.isRedisHealthy = false;
    });
  }

  private async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    // Periodic health check
    const now = Date.now();
    if (!this.isRedisHealthy && now - this.lastHealthCheck > this.HEALTH_CHECK_INTERVAL) {
      this.lastHealthCheck = now;
      // Try to reconnect
      this.client.connect().catch(() => {/* silent fail */});
    }

    if (!this.isRedisHealthy) {
      return await fallbackOperation();
    }

    try {
      return await operation();
    } catch (error) {
      // Redis operation failed, use fallback
      this.isRedisHealthy = false;
      console.warn(`⚠️ Redis ${operationName} failed, using fallback`);
      return await fallbackOperation();
    }
  }

  async get(key: string): Promise<string | null> {
    return this.executeWithFallback(
      () => this.client.get(key),
      () => this.fallback.get(key),
      'get'
    );
  }

  async set(key: string, value: string, expiresInSeconds?: number): Promise<void> {
    return this.executeWithFallback(
      async () => {
        if (expiresInSeconds) {
          await this.client.setex(key, expiresInSeconds, value);
        } else {
          await this.client.set(key, value);
        }
      },
      () => this.fallback.set(key, value, expiresInSeconds),
      'set'
    );
  }

  async del(key: string): Promise<void> {
    return this.executeWithFallback(
      () => this.client.del(key).then(() => {}),
      () => this.fallback.del(key),
      'del'
    );
  }

  async keys(pattern: string): Promise<string[]> {
    return this.executeWithFallback(
      () => this.client.keys(pattern),
      () => this.fallback.keys(pattern),
      'keys'
    );
  }

  async ttl(key: string): Promise<number> {
    return this.executeWithFallback(
      () => this.client.ttl(key),
      () => this.fallback.ttl(key),
      'ttl'
    );
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      // Ignore disconnect errors
    }
  }
}


/**
 * Get storage adapter instance
 * Automatically uses Redis with resilient fallback if REDIS_URL is set
 * Otherwise uses in-memory storage
 */
export function getStorageAdapter(): StorageAdapter {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl && redisUrl.startsWith('redis')) {
    console.log('🚀 Using Redis with automatic in-memory fallback for security features');
    console.log('   Redis will provide distributed rate limiting and session management');
    console.log('   If Redis is unreachable, the app will seamlessly fall back to in-memory storage');
    return new ResilientRedisStorage(redisUrl);
  }

  console.log('⚠️ Using in-memory storage (NOT suitable for production with multiple instances)');
  console.log('   Set REDIS_URL in .env for production deployment');
  console.log('   For multi-instance deployments, Redis is required for distributed security features');
  
  const memStorage = new MemoryStorage();
  memStorage.startCleanup();
  return memStorage;
}

// Singleton instance
let storageInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = getStorageAdapter();
  }
  return storageInstance;
}

