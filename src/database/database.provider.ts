import { Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schemas/index.js';
import * as relations from './relations.js';
import type { DrizzleModuleOptions } from './types.js';

const STATEMENT_TIMEOUT = '30s';
const logger = new Logger('DatabaseProvider');

export function createPool(options: DrizzleModuleOptions): Pool {
  const pool = new Pool({
    connectionString: options.connectionString,
    max: options.pool?.max ?? 10,
    min: options.pool?.min ?? 2,
    idleTimeoutMillis: options.pool?.idleTimeoutMillis ?? 30_000,
    connectionTimeoutMillis: options.pool?.connectionTimeoutMillis ?? 5000,
  });

  pool.on('connect', (client) => {
    client.query(`SET statement_timeout = '${STATEMENT_TIMEOUT}'`).catch((err: unknown) => {
      logger.error(
        'Failed to set statement_timeout on connection',
        err instanceof Error ? err.stack : String(err),
      );
    });
  });

  return pool;
}

export function createDrizzleInstance(pool: Pool) {
  return drizzle({ client: pool, schema: { ...schema, ...relations } });
}
