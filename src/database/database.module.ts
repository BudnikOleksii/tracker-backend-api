import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import type { DynamicModule } from '@nestjs/common';

import { DB_TOKEN, POOL_TOKEN } from './types.js';
import { createPool, createDrizzleInstance } from './database.provider.js';
import type { Env } from '../app/config/env.schema.js';

@Global()
@Module({})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(POOL_TOKEN) private readonly pool: Pool) {}

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: POOL_TOKEN,
          inject: [ConfigService],
          useFactory: (configService: ConfigService<Env, true>) =>
            createPool({
              connectionString: configService.get('DATABASE_URL', { infer: true }),
              pool: {
                max: configService.get('DB_POOL_MAX', { infer: true }),
                min: configService.get('DB_POOL_MIN', { infer: true }),
              },
            }),
        },
        {
          provide: DB_TOKEN,
          inject: [POOL_TOKEN],
          useFactory: (pool: Pool) => createDrizzleInstance(pool),
        },
      ],
      exports: [DB_TOKEN],
    };
  }
}
