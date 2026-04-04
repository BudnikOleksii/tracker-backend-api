import { RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { createCorsConfig } from './app/config/cors.config.js';
import { setupSwagger } from './app/config/swagger.config.js';
import { createValidationPipe } from './app/config/validation.config.js';
import { AllExceptionsFilter } from './app/filters/all-exceptions.filter.js';
import { ProblemDetailsFilter } from './app/filters/problem-details.filter.js';
import { RequestContextInterceptor } from './app/interceptors/request-context.interceptor.js';
import { TimeoutInterceptor } from './app/interceptors/timeout.interceptor.js';
import { TransformInterceptor } from './app/interceptors/transform.interceptor.js';
import { AppModule } from './app.module.js';
import type { Env } from './app/config/env.schema.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.use(cookieParser());

  const configService = app.get<ConfigService<Env, true>>(ConfigService);
  const allowedOrigins = configService.get('ALLOWED_ORIGINS', { infer: true });
  app.enableCors(createCorsConfig(allowedOrigins));

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/{*path}', method: RequestMethod.ALL },
    ],
  });

  app.useGlobalFilters(app.get(ProblemDetailsFilter), app.get(AllExceptionsFilter));

  app.useGlobalInterceptors(
    app.get(RequestContextInterceptor),
    new TimeoutInterceptor(30_000),
    new TransformInterceptor(app.get(Reflector)),
  );

  app.useGlobalPipes(createValidationPipe());

  setupSwagger(app);

  const port = configService.get('PORT', { infer: true });
  await app.listen(port);

  const logger = app.get(Logger);
  const env = configService.get('NODE_ENV', { infer: true });
  const baseUrl = `http://localhost:${port}`;

  const startupMessage = `
┌─────────────────────────────────────────────────────┐
│                 Tracker Backend API                  │
├─────────────────────────────────────────────────────┤
│  Environment:  ${env.padEnd(35)}  │
│  Port:         ${String(port).padEnd(35)}  │
├─────────────────────────────────────────────────────┤
│  Endpoints:                                         │
│  - App:        ${baseUrl.padEnd(35)}  │
│  - Docs:       ${`${baseUrl}/docs`.padEnd(35)}  │
│  - Swagger:    ${`${baseUrl}/swagger`.padEnd(35)}  │
│  - Health:     ${`${baseUrl}/health`.padEnd(35)}  │
└─────────────────────────────────────────────────────┘`;

  logger.log(startupMessage);
}

await bootstrap();
