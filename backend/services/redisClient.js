import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redis = null;
let isRedisConnected = false;
const inMemoryCache = new Map();

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true
    });

    redis.connect().then(() => {
      isRedisConnected = true;
      console.log('✅ Connected to Redis cache & queue store');
    }).catch((err) => {
      console.warn('⚠️ Redis connection warning, using in-memory store:', err.message);
      redis = null;
      isRedisConnected = false;
    });

    redis.on('error', (err) => {
      if (isRedisConnected) {
        console.warn('⚠️ Redis error:', err.message);
      }
    });
  } catch (err) {
    console.warn('⚠️ Could not initialize Redis client, using in-memory store:', err.message);
  }
} else {
  console.log('ℹ️ REDIS_URL not set. Running in-memory cache.');
}

export async function cacheSet(key, value, ttlSeconds = 3600) {
  const stringVal = typeof value === 'string' ? value : JSON.stringify(value);
  if (redis && isRedisConnected) {
    try {
      await redis.set(key, stringVal, 'EX', ttlSeconds);
      return true;
    } catch (e) {
      // fallback
    }
  }
  inMemoryCache.set(key, { value: stringVal, expires: Date.now() + ttlSeconds * 1000 });
  return true;
}

export async function cacheGet(key) {
  if (redis && isRedisConnected) {
    try {
      const data = await redis.get(key);
      if (data) {
        try { return JSON.parse(data); } catch { return data; }
      }
    } catch (e) {
      // fallback
    }
  }

  const item = inMemoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    inMemoryCache.delete(key);
    return null;
  }
  try { return JSON.parse(item.value); } catch { return item.value; }
}

export async function cacheDel(key) {
  if (redis && isRedisConnected) {
    try {
      await redis.del(key);
    } catch (e) {}
  }
  inMemoryCache.delete(key);
}

export { redis, isRedisConnected };
