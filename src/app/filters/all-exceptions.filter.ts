import { Catch, HttpException, HttpStatus, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import type { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';

import type { ProblemDetailsDto } from '@/shared/dtos/problem-details.dto.js';

import { ProblemDetailsFilter } from './problem-details.filter.js';
import type { Env } from '../config/env.schema.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly cls: ClsService,
    @Inject(ProblemDetailsFilter)
    private readonly problemDetailsFilter: ProblemDetailsFilter,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (exception instanceof HttpException) {
      return this.problemDetailsFilter.catch(exception, host);
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    const isProduction = this.configService.get('NODE_ENV', { infer: true }) === 'production';
    let message = 'Internal server error';
    if (exception instanceof Error) {
      message = isProduction ? 'The server encountered an unexpected error' : exception.message;
    }

    const requestId = this.cls.getId();

    const baseUrl =
      this.configService.get('API_BASE_URL', { infer: true }) ?? 'https://api.example.com';
    const problemDetails: ProblemDetailsDto = {
      type: `${baseUrl}/errors/internal-server-error`,
      title: 'Internal Server Error',
      status,
      instance: request.url,
      request_id: requestId,
      timestamp: new Date().toISOString(),
      code: 'INTERNAL_SERVER_ERROR',
      detail: message,
    };

    const logMessage = `${requestId ? `[req:${requestId}] ` : ''}${request.method} ${request.url} ${status}`;
    if (exception instanceof Error) {
      this.logger.error(logMessage, exception.stack);
    } else {
      this.logger.error(logMessage, JSON.stringify(exception));
    }

    response.setHeader('Content-Type', 'application/problem+json');
    response.setHeader('Cache-Control', 'no-store');
    response.status(status).json(problemDetails);
  }
}
