import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { ClsModuleOptions, ClsService } from 'nestjs-cls';

import { convertHeaderToString } from '@/shared/utils/header.utils.js';

export function createClsConfig(): ClsModuleOptions {
  return {
    global: true,
    middleware: {
      mount: true,
      generateId: true,
      idGenerator: (request: Request) => {
        const requestId = convertHeaderToString(request.headers['x-request-id'])?.trim();

        return requestId || randomUUID();
      },
      setup: setupClsContext,
    },
  };
}

function setupClsContext(cls: ClsService, request: Request) {
  cls.set('userAgent', request.headers['user-agent']);
  cls.set('ip', request.ip);
  cls.set('method', request.method);
  cls.set('url', request.url);
}
