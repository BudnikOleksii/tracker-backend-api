import {
  Catch,
  HttpException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClsService } from 'nestjs-cls'

import type { Env } from '../config/env.schema.js'
import type { ProblemDetailsDto, FieldError } from '@/shared/dtos/problem-details.dto.js'
import type { ValidationErrorItem } from '@/shared/types/validation-error.js'
import type {
  ExceptionFilter,
  ArgumentsHost,
} from '@nestjs/common'
import type { Request, Response } from 'express'

@Catch(HttpException)
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name)

  constructor(
    private readonly cls: ClsService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse<Response>()
    const request = context.getRequest<Request>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()

    const errorPayload = this.buildErrorPayload(
      exceptionResponse as string | Record<string, unknown>,
      exception,
      status,
    )
    const problemDetails: ProblemDetailsDto = {
      type: this.getTypeUri(status),
      title: this.getTitle(status, exception),
      status,
      instance: request.url,
      request_id: this.cls.getId(),
      timestamp: new Date().toISOString(),
      ...errorPayload,
    }

    const logMessage = `${request.method} ${request.url} ${status}`
    if (status >= 500) {
      this.logger.error(logMessage, exception.stack)
    } else {
      this.logger.warn(logMessage)
    }

    response.setHeader('Content-Type', 'application/problem+json')
    response.setHeader('Cache-Control', 'no-store')
    response.status(status).json(problemDetails)
  }

  private getTypeUri(status: number): string {
    const baseUrl = this.configService.get('API_BASE_URL', { infer: true })
    const errorType = this.getErrorType(status)
    return `${baseUrl}/errors/${errorType}`
  }

  private getErrorType(status: number): string {
    const typeMap: Record<number, string> = {
      400: 'bad-request',
      401: 'unauthorized',
      403: 'forbidden',
      404: 'not-found',
      409: 'conflict',
      422: 'validation-failed',
      429: 'rate-limit-exceeded',
      500: 'internal-server-error',
      503: 'service-unavailable',
    }
    return typeMap[status] ?? 'unknown-error'
  }

  private getTitle(status: number, exception: HttpException): string {
    const titleMap: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      503: 'Service Unavailable',
    }
    return titleMap[status] ?? exception.name
  }

  private buildErrorPayload(
    exceptionResponse: string | Record<string, unknown>,
    exception: HttpException,
    status: number,
  ): Pick<ProblemDetailsDto, 'code' | 'detail' | 'errors'> {
    if (status === 400 || status === 422) {
      const validationErrors = this.extractValidationErrors(exceptionResponse)
      if (validationErrors && validationErrors.length > 0) {
        return {
          code: 'VALIDATION_FAILED',
          detail: 'Request validation failed',
          errors: validationErrors,
        }
      }
    }

    if (typeof exceptionResponse === 'object' && 'code' in exceptionResponse) {
      const code = exceptionResponse.code as string
      const msg = exceptionResponse.message
      const detail = typeof msg === 'string' ? msg : exception.message
      return { code, detail }
    }

    const detail = typeof exceptionResponse === 'string'
      ? exceptionResponse
      : exception.message
    const fallbackCodeMap: Record<number, string> = {
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'RESOURCE_NOT_FOUND',
      409: 'RESOURCE_CONFLICT',
      429: 'RATE_LIMIT_EXCEEDED',
    }
    const code = status >= 500
      ? 'INTERNAL_SERVER_ERROR'
      : (fallbackCodeMap[status] ?? 'BAD_REQUEST')
    return { code, detail }
  }

  private extractValidationErrors(
    exceptionResponse: string | Record<string, unknown>,
  ): FieldError[] | undefined {
    if (
      typeof exceptionResponse === 'object'
      && 'message' in exceptionResponse
      && Array.isArray(exceptionResponse.message)
    ) {
      const errors: FieldError[] = []

      for (const item of exceptionResponse.message) {
        if (typeof item === 'string') {
          const parts = item.split(' ')
          const field = parts[0] ?? 'unknown'
          errors.push({
            field,
            pointer: `/${field}`,
            code: 'VALIDATION_ERROR',
            message: item,
          })
        } else if (this.isValidationErrorItem(item)) {
          const field = item.property
          const constraints = item.constraints ?? {}
          const contexts = item.contexts ?? {}

          for (const [constraintName, message] of Object.entries(constraints)) {
            const contextCode = contexts[constraintName]?.code
            errors.push({
              field,
              pointer: `/${field}`,
              code: contextCode ?? 'VALIDATION_ERROR',
              message,
            })
          }
        }
      }

      return errors.length > 0 ? errors : undefined
    }
    return undefined
  }

  private isValidationErrorItem(item: unknown): item is ValidationErrorItem {
    return (
      typeof item === 'object'
      && item !== null
      && 'property' in item
      && typeof (item as ValidationErrorItem).property === 'string'
    )
  }
}
