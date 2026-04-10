import { RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { createCorsConfig } from './app/config/cors.config.js';
import { setupSwagger } from './app/config/swagger.config.js';
import { createValidationPipe } from './app/config/validation.config.js';
import { AllExceptionsFilter } from './app/filters/all-exceptions.filter.js';
import { ProblemDetailsFilter } from './app/filters/problem-details.filter.js';
import { RequestContextInterceptor } from './app/interceptors/request-context.interceptor.js';
import { TimeoutInterceptor } from './app/interceptors/timeout.interceptor.js';
import { AppModule } from './app.module.js';
import type { Env } from './app/config/env.schema.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  const configService = app.get<ConfigService<Env, true>>(ConfigService);
  const allowedOrigins = configService.get('ALLOWED_ORIGINS', { infer: true });
  app.enableCors(createCorsConfig(allowedOrigins));

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/{*path}', method: RequestMethod.ALL },
      { path: 'auth/google/callback', method: RequestMethod.GET },
      { path: 'auth/github/callback', method: RequestMethod.GET },
    ],
  });

  app.useGlobalFilters(app.get(ProblemDetailsFilter), app.get(AllExceptionsFilter));

  app.useGlobalInterceptors(app.get(RequestContextInterceptor), app.get(TimeoutInterceptor));

  app.useGlobalPipes(createValidationPipe());

  const env = configService.get('NODE_ENV', { infer: true });

  if (env !== 'production') {
    setupSwagger(app);
  }

  app.enableShutdownHooks();

  const port = configService.get('PORT', { infer: true });
  await app.listen(port);

  const logger = app.get(Logger);
  const baseUrl = `http://localhost:${port}`;

  const docsLines =
    env !== 'production'
      ? `│  - Docs:       ${`${baseUrl}/docs`.padEnd(35)}  │\n│  - Swagger:    ${`${baseUrl}/swagger`.padEnd(35)}  │\n`
      : '';

  const startupMessage = `
┌─────────────────────────────────────────────────────┐
│                 Tracker Backend API                  │
├─────────────────────────────────────────────────────┤
│  Environment:  ${env.padEnd(35)}  │
│  Port:         ${String(port).padEnd(35)}  │
├─────────────────────────────────────────────────────┤
│  Endpoints:                                         │
│  - App:        ${baseUrl.padEnd(35)}  │
${docsLines}│  - Health:     ${`${baseUrl}/health`.padEnd(35)}  │
└─────────────────────────────────────────────────────┘`;

  logger.log(startupMessage);
}

await bootstrap();
