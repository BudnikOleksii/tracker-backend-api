import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schemas/index.js';
import * as relations from './relations.js';
import type { DrizzleModuleOptions } from './types.js';

export function createDrizzleInstance(options: DrizzleModuleOptions) {
  const pool = new Pool({
    connectionString: options.connectionString,
    max: options.pool?.max ?? 10,
    min: options.pool?.min ?? 2,
    idleTimeoutMillis: options.pool?.idleTimeoutMillis ?? 30_000,
    connectionTimeoutMillis: options.pool?.connectionTimeoutMillis ?? 5000,
  });

  return drizzle({ client: pool, schema: { ...schema, ...relations } });
}
