import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { DB_TOKEN } from './types.js'
import { createDrizzleInstance } from './database.provider.js'

import type { Env } from '../app/config/env.schema.js'
import type { DynamicModule } from '@nestjs/common'

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DB_TOKEN,
          inject: [ConfigService],
          useFactory: (configService: ConfigService<Env, true>) => {
            return createDrizzleInstance({
              connectionString: configService.get('DATABASE_URL', { infer: true }),
              pool: {
                max: configService.get('DB_POOL_MAX', { infer: true }),
                min: configService.get('DB_POOL_MIN', { infer: true }),
              },
            })
          },
        },
      ],
      exports: [DB_TOKEN],
    }
  }
}
