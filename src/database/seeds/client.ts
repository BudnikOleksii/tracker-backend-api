import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from '../schemas/index.js';
import * as relations from '../relations.js';

export function createSeedClient(connectionString: string) {
  const pool = new Pool({ connectionString });
  const db = drizzle({ client: pool, schema: { ...schema, ...relations } });

  return { db, pool };
}

export type SeedDb = ReturnType<typeof createSeedClient>['db'];
