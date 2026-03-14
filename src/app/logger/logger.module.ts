import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import { createLoggerConfig } from './logger.config.js';
import type { Env } from '../config/env.schema.js';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => createLoggerConfig(config),
    }),
  ],
})
export class LoggerModule {}
