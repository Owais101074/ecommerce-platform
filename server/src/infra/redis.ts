import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * BullMQ requires `maxRetriesPerRequest: null`, so every connection created here
 * shares that setting. Each consumer gets its own connection because a worker's
 * blocking commands must not stall cache reads.
 */
export function createRedisConnection(name: string): Redis {
  if (!env.REDIS_URL) {
    throw new Error('REDIS_URL is not configured');
  }

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    connectionName: `ecommerce-${name}`,
  });

  client.on('connect', () => logger.info('redis.connected', { name }));
  client.on('error', (error) => logger.warn('redis.error', { name, err: error }));

  return client;
}
