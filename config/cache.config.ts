import * as redisStore from 'cache-manager-redis-store';

export const cacheConfig = {
    store: redisStore as any,
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    ttl: Number(process.env.CACHE_TTL) || 600,
  };
