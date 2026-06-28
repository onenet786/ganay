import { createClient } from 'redis';
import { config } from './config.js';

class Cache {
  constructor() {
    this.isRedis = !!config.REDIS_URL;
    this.client = null;
    this.memoryCache = new Map();
    this.memoryExpirations = new Map();

    if (this.isRedis) {
      console.log('Cache Mode: Redis Enabled');
      try {
        this.client = createClient({ url: config.REDIS_URL });
        this.client.on('error', (err) => {
          console.error('Redis client error, falling back to In-Memory Caching:', err.message);
          this.isRedis = false;
        });
        this.client.connect().catch((err) => {
          console.error('Redis connection failed, falling back to In-Memory Caching:', err.message);
          this.isRedis = false;
        });
      } catch (err) {
        console.error('Failed to create Redis client, falling back to In-Memory:', err.message);
        this.isRedis = false;
      }
    } else {
      console.log('Cache Mode: Local In-Memory Cache fallback');
    }
  }

  async get(key) {
    if (this.isRedis) {
      try {
        return await this.client.get(key);
      } catch (err) {
        console.error('Redis get error:', err.message);
        return this.getMemoryValue(key);
      }
    } else {
      return this.getMemoryValue(key);
    }
  }

  async set(key, value, expirySeconds = 1800) {
    if (this.isRedis) {
      try {
        await this.client.set(key, value, { EX: expirySeconds });
      } catch (err) {
        console.error('Redis set error:', err.message);
        this.setMemoryValue(key, value, expirySeconds);
      }
    } else {
      this.setMemoryValue(key, value, expirySeconds);
    }
  }

  async del(key) {
    if (this.isRedis) {
      try {
        await this.client.del(key);
      } catch (err) {
        console.error('Redis del error:', err.message);
        this.delMemoryValue(key);
      }
    } else {
      this.delMemoryValue(key);
    }
  }

  // --- MEMORY FALLBACK IMPLEMENTATION ---

  getMemoryValue(key) {
    const expiration = this.memoryExpirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.delMemoryValue(key);
      return null;
    }
    return this.memoryCache.get(key) || null;
  }

  setMemoryValue(key, value, expirySeconds) {
    this.memoryCache.set(key, value);
    if (expirySeconds) {
      this.memoryExpirations.set(key, Date.now() + expirySeconds * 1000);
    }
  }

  delMemoryValue(key) {
    this.memoryCache.delete(key);
    this.memoryExpirations.delete(key);
  }
}

export const cache = new Cache();
