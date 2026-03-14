import { ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { CanActivate, ExecutionContext } from '@nestjs/common';

import { hasRequiredRole } from '../enums/role.enum.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { ErrorCode } from '../enums/error-code.enum.js';
import type { UserRole } from '../enums/role.enum.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: { role: UserRole } }>();
    const actorRole = request.user?.role;

    if (!actorRole) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Insufficient permissions',
      });
    }

    const hasAccess = requiredRoles.some((required) => hasRequiredRole(actorRole, required));

    if (!hasAccess) {
      throw new ForbiddenException({
        code: ErrorCode.INSUFFICIENT_SCOPE,
        message: 'Insufficient permissions',
      });
    }

    return true;
  }
}
