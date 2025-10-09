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
 * Redis Storage (for production)
 * Uncomment this when you have Redis setup
 */

class RedisStorage implements StorageAdapter {
  private client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, expiresInSeconds?: number): Promise<void> {
    if (expiresInSeconds) {
      await this.client.setex(key, expiresInSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}


/**
 * Get storage adapter instance
 * Automatically uses Redis if REDIS_URL is set, otherwise falls back to memory
 */
export function getStorageAdapter(): StorageAdapter {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl && redisUrl.startsWith('redis')) {
    console.log('🚀 Using Redis for distributed storage');
    // Uncomment when Redis is setup:
     return new RedisStorage(redisUrl);
    
    console.warn('⚠️ REDIS_URL is set but Redis client is not installed. Falling back to in-memory storage.');
    console.warn('   To use Redis: npm install ioredis and uncomment RedisStorage in redis-adapter.ts');
  }

  console.log('⚠️ Using in-memory storage (NOT suitable for production with multiple instances)');
  console.log('   Set REDIS_URL in .env for production deployment');
  
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

