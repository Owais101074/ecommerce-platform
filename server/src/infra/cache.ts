import { createHash } from 'node:crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { createRedisConnection } from './redis';

type CacheDriver = 'memory' | 'redis' | 'none';

interface CacheEntry {
  value: string;
  expiresAt: number;
}

interface CacheStore {
  readonly driver: CacheDriver;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  invalidatePrefix(prefix: string): Promise<void>;
  clear(): Promise<void>;
  close(): Promise<void>;
}

class MemoryStore implements CacheStore {
  readonly driver = 'memory' as const;
  private readonly entries = new Map<string, CacheEntry>();

  async get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
      }
    }
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }

  async close(): Promise<void> {
    this.entries.clear();
  }
}

class RedisStore implements CacheStore {
  readonly driver = 'redis' as const;
  private readonly client = createRedisConnection('cache');

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        `${prefix}*`,
        'COUNT',
        100,
      );

      if (keys.length > 0) {
        await this.client.del(...keys);
      }

      cursor = nextCursor;
    } while (cursor !== '0');
  }

  async clear(): Promise<void> {
    await this.invalidatePrefix('catalog:');
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}

class NoopStore implements CacheStore {
  readonly driver = 'none' as const;

  async get(): Promise<string | null> {
    return null;
  }

  async set(): Promise<void> {
    return undefined;
  }

  async invalidatePrefix(): Promise<void> {
    return undefined;
  }

  async clear(): Promise<void> {
    return undefined;
  }

  async close(): Promise<void> {
    return undefined;
  }
}

let store: CacheStore | null = null;

function getStore(): CacheStore {
  if (!store) {
    if (env.CACHE_DRIVER === 'redis') {
      store = new RedisStore();
    } else if (env.CACHE_DRIVER === 'none') {
      store = new NoopStore();
    } else {
      store = new MemoryStore();
    }
  }

  return store;
}

function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);
}

export const cacheKeys = {
  productList: (query: unknown): string => `catalog:products:list:${digest(query)}`,
  productDetail: (slug: string): string => `catalog:products:detail:${slug}`,
  categoryList: (): string => 'catalog:categories:list',
  categoryDetail: (slug: string): string => `catalog:categories:detail:${slug}`,
};

const PREFIXES = {
  products: 'catalog:products:',
  categories: 'catalog:categories:',
} as const;

/**
 * Reads through the cache. A cache failure must never fail the request, so
 * Redis errors fall back to the loader and only produce a log entry.
 */
export async function cached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlSeconds = env.CACHE_TTL_SECONDS,
): Promise<T> {
  const cache = getStore();

  if (cache.driver === 'none') {
    return loader();
  }

  let raw: string | null = null;

  try {
    raw = await cache.get(key);
  } catch (error) {
    logger.warn('cache.get-failed', { key, err: error });
  }

  if (raw !== null) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      logger.warn('cache.invalid-json', { key });
    }
  }

  const value = await loader();

  try {
    await cache.set(key, JSON.stringify(value), ttlSeconds);
  } catch (error) {
    logger.warn('cache.set-failed', { key, err: error });
  }

  return value;
}

async function invalidatePrefixes(prefixes: string[]): Promise<void> {
  const cache = getStore();

  for (const prefix of prefixes) {
    try {
      await cache.invalidatePrefix(prefix);
    } catch (error) {
      logger.warn('cache.invalidate-failed', { prefix, err: error });
    }
  }
}

export async function invalidateProductCache(): Promise<void> {
  await invalidatePrefixes([PREFIXES.products]);
}

export async function invalidateCategoryCache(): Promise<void> {
  await invalidatePrefixes([PREFIXES.categories]);
}

export async function invalidateCatalogCache(): Promise<void> {
  await invalidatePrefixes([PREFIXES.products, PREFIXES.categories]);
}

export function getCacheDriver(): CacheDriver {
  return getStore().driver;
}

/** Test and shutdown helper. Redis only clears the catalogue namespace. */
export async function resetCache(): Promise<void> {
  await getStore().clear();
}

export async function closeCache(): Promise<void> {
  if (!store) {
    return;
  }

  await store.close();
  store = null;
}
