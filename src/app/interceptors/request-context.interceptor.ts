import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { tap } from 'rxjs/operators'

import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import type { Response } from 'express'
import type { Observable } from 'rxjs'

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp()
    const response = httpContext.getResponse<Response>()

    const requestId = this.cls.getId()
    if (requestId) {
      response.setHeader('X-Request-Id', requestId)
    }

    return next.handle().pipe(
      tap(() => {}),
    )
  }
}
