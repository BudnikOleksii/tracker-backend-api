import { randomUUID } from 'node:crypto'

import type { Request } from 'express'
import type { ClsModuleOptions, ClsService } from 'nestjs-cls'

export function createClsConfig(): ClsModuleOptions {
  return {
    global: true,
    middleware: {
      mount: true,
      generateId: true,
      idGenerator: (request: Request) => {
        return (request.headers['x-request-id'] as string) || randomUUID()
      },
      setup: setupClsContext,
    },
  }
}

function setupClsContext(cls: ClsService, request: Request) {
  cls.set('userAgent', request.headers['user-agent'])
  cls.set('ip', request.ip)
  cls.set('method', request.method)
  cls.set('url', request.url)
}
