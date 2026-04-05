import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { Provider } from '@nestjs/common';

import type { Env } from '@/app/config/env.schema.js';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const redisClientProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService<Env, true>): Redis => {
    return new Redis(configService.get('REDIS_URL', { infer: true }));
  },
};
