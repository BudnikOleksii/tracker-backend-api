import { createHash } from 'node:crypto';

interface CacheKeyOptions {
  module: string;
  userId: string;
  operation: string;
  params?: object;
}

export function buildCacheKey(options: CacheKeyOptions): string {
  const base = `${options.module}:${options.userId}:${options.operation}`;
  if (!options.params) {
    return base;
  }

  const hash = createHash('sha256')
    .update(JSON.stringify(options.params))
    .digest('hex')
    .slice(0, 12);

  return `${base}:${hash}`;
}

export function buildCachePrefix(module: string, userId?: string): string {
  if (userId) {
    return `${module}:${userId}:`;
  }

  return `${module}:`;
}
