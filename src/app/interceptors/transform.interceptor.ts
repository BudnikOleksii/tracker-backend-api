import { Injectable } from '@nestjs/common'
import { map } from 'rxjs/operators'

import { USE_ENVELOPE_KEY } from '@/shared/decorators/use-envelope.decorator.js'

import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { Observable } from 'rxjs'

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (data === null || data === undefined) {
          return data
        }

        const useEnvelope = this.reflector.get<boolean>(
          USE_ENVELOPE_KEY,
          context.getHandler(),
        )

        if (useEnvelope) {
          return data
        }

        return data
      }),
    )
  }
}
