import { Catch, HttpException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import type { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';

import { HTTP_STATUS } from '@/shared/constants/http-status.constants.js';
import type { HttpStatusCode } from '@/shared/constants/http-status.constants.js';
import type { ProblemDetailsDto, FieldError } from '@/shared/dtos/problem-details.dto.js';
import type { ValidationErrorItem } from '@/shared/types/validation-error.js';

import type { Env } from '../config/env.schema.js';

const TYPE_MAP: Partial<Record<HttpStatusCode, string>> = {
  [HTTP_STATUS.BAD_REQUEST]: 'bad-request',
  [HTTP_STATUS.UNAUTHORIZED]: 'unauthorized',
  [HTTP_STATUS.FORBIDDEN]: 'forbidden',
  [HTTP_STATUS.NOT_FOUND]: 'not-found',
  [HTTP_STATUS.CONFLICT]: 'conflict',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'validation-failed',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'rate-limit-exceeded',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'internal-server-error',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'service-unavailable',
};

const TITLE_MAP: Partial<Record<HttpStatusCode, string>> = {
  [HTTP_STATUS.BAD_REQUEST]: 'Bad Request',
  [HTTP_STATUS.UNAUTHORIZED]: 'Unauthorized',
  [HTTP_STATUS.FORBIDDEN]: 'Forbidden',
  [HTTP_STATUS.NOT_FOUND]: 'Not Found',
  [HTTP_STATUS.CONFLICT]: 'Conflict',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service Unavailable',
};

const FALLBACK_CODE_MAP: Partial<Record<HttpStatusCode, string>> = {
  [HTTP_STATUS.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HTTP_STATUS.FORBIDDEN]: 'FORBIDDEN',
  [HTTP_STATUS.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
  [HTTP_STATUS.CONFLICT]: 'RESOURCE_CONFLICT',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
};

@Catch(HttpException)
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  constructor(
    private readonly cls: ClsService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorPayload = this.buildErrorPayload(
      exceptionResponse as string | Record<string, unknown>,
      exception,
      status,
    );
    const problemDetails: ProblemDetailsDto = {
      type: this.getTypeUri(status),
      title: this.getTitle(status, exception),
      status,
      instance: request.url,
      request_id: this.cls.getId(),
      timestamp: new Date().toISOString(),
      ...errorPayload,
    };

    const logMessage = `${request.method} ${request.url} ${status}`;
    if (status >= 500) {
      this.logger.error(logMessage, exception.stack);
    } else {
      this.logger.warn(logMessage);
    }

    response.setHeader('Content-Type', 'application/problem+json');
    response.setHeader('Cache-Control', 'no-store');
    response.status(status).json(problemDetails);
  }

  private getTypeUri(status: number): string {
    const baseUrl = this.configService.get('API_BASE_URL', { infer: true });
    const errorType = TYPE_MAP[status as HttpStatusCode] ?? 'unknown-error';

    return `${baseUrl}/errors/${errorType}`;
  }

  private getTitle(status: number, exception: HttpException): string {
    return TITLE_MAP[status as HttpStatusCode] ?? exception.name;
  }

  private buildErrorPayload(
    exceptionResponse: string | Record<string, unknown>,
    exception: HttpException,
    status: number,
  ): Pick<ProblemDetailsDto, 'code' | 'detail' | 'errors'> {
    if (status === HTTP_STATUS.BAD_REQUEST || status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
      const validationErrors = this.extractValidationErrors(exceptionResponse);
      if (validationErrors && validationErrors.length > 0) {
        return {
          code: 'VALIDATION_FAILED',
          detail: 'Request validation failed',
          errors: validationErrors,
        };
      }
    }

    if (typeof exceptionResponse === 'object' && 'code' in exceptionResponse) {
      const code = exceptionResponse.code as string;
      const msg = exceptionResponse.message;
      const detail = typeof msg === 'string' ? msg : exception.message;

      return { code, detail };
    }

    const detail = typeof exceptionResponse === 'string' ? exceptionResponse : exception.message;
    const code =
      status >= HTTP_STATUS.INTERNAL_SERVER_ERROR
        ? 'INTERNAL_SERVER_ERROR'
        : (FALLBACK_CODE_MAP[status as HttpStatusCode] ?? 'BAD_REQUEST');

    return { code, detail };
  }

  private extractValidationErrors(
    exceptionResponse: string | Record<string, unknown>,
  ): FieldError[] | undefined {
    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse &&
      Array.isArray(exceptionResponse.message)
    ) {
      const errors: FieldError[] = [];

      for (const item of exceptionResponse.message) {
        if (typeof item === 'string') {
          const parts = item.split(' ');
          const field = parts[0] ?? 'unknown';
          errors.push({
            field,
            pointer: `/${field}`,
            code: 'VALIDATION_ERROR',
            message: item,
          });
        } else if (this.isValidationErrorItem(item)) {
          const field = item.property;
          const constraints = item.constraints ?? {};
          const contexts = item.contexts ?? {};

          for (const [constraintName, message] of Object.entries(constraints)) {
            const contextCode = contexts[constraintName]?.code;
            errors.push({
              field,
              pointer: `/${field}`,
              code: contextCode ?? 'VALIDATION_ERROR',
              message,
            });
          }
        }
      }

      return errors.length > 0 ? errors : undefined;
    }

    return undefined;
  }

  private isValidationErrorItem(item: unknown): item is ValidationErrorItem {
    return (
      typeof item === 'object' &&
      item !== null &&
      'property' in item &&
      typeof item.property === 'string'
    );
  }
}
