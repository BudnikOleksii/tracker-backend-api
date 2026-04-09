import { Injectable } from '@nestjs/common';
import { tap } from 'rxjs/operators';
import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';

import type { AuthUser } from '@/modules/auth/auth.types.js';

import { AuditLogService } from './audit-log.service.js';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const user = req.user as AuthUser | undefined;

    if (!MUTATING_METHODS.has(method) || !user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        void this.auditLogService.log({
          action: `${method} ${url}`,
          actorId: user.id,
          actorEmail: user.email,
          resourceId: (req.params as Record<string, string>)?.id,
        });
      }),
    );
  }
}
