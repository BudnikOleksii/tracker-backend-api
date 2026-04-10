import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { throttler, context } = requestProps;

    if (throttler.name === 'auth') {
      const handler = context.getHandler();
      const classRef = context.getClass();
      const routeLimit = this.reflector.getAllAndOverride<number | undefined>(
        `THROTTLER:LIMIT${throttler.name}`,
        [handler, classRef],
      );

      if (routeLimit === undefined) {
        return super.handleRequest(requestProps);
      }
    }

    return super.handleRequest(requestProps);
  }
}
