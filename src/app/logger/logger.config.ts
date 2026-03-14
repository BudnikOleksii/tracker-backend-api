import { RequestMethod } from '@nestjs/common'

import { redactCensor, redactPaths } from './redaction.config.js'

import type { Env } from '../config/env.schema.js'
import type { ConfigService } from '@nestjs/config'
import type { Params } from 'nestjs-pino'
import type { IncomingMessage, ServerResponse } from 'node:http'

export function createLoggerConfig(config: ConfigService<Env, true>): Params {
  const nodeEnv: 'development' | 'production' | 'test' = config.get('NODE_ENV')
  const isProduction = nodeEnv === 'production'
  const logLevel = getLogLevel(nodeEnv)

  return {
    pinoHttp: {
      level: logLevel,

      autoLogging: {
        ignore: (req) => {
          const url = req.url ?? ''
          return !url.startsWith('/api/')
        },
      },

      redact: {
        paths: redactPaths,
        censor: redactCensor,
      },

      serializers: {
        req: (req: IncomingMessage & { id?: string, query?: unknown, params?: unknown }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          query: req.query,
          params: req.params,
          remoteAddress: req.socket?.remoteAddress,
        }),
        res: (res: ServerResponse) => ({
          statusCode: res.statusCode,
        }),
        err: (error: Error) => ({
          type: error.constructor.name,
          message: error.message,
          stack: error.stack,
        }),
      },

      customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
        return `${req.method} ${req.url} ${res.statusCode}`
      },

      customErrorMessage: (req: IncomingMessage, res: ServerResponse, error: Error) => {
        return `${req.method} ${req.url} ${res.statusCode} - ${error.message}`
      },

      ...(isProduction
        ? {}
        : {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
                messageFormat: '{context} | {msg}',
              },
            },
          }),
    },

    exclude: [
      { method: RequestMethod.GET, path: 'health' },
      { method: RequestMethod.GET, path: 'health/live' },
      { method: RequestMethod.GET, path: 'health/ready' },
    ],
  }
}

function getLogLevel(nodeEnv: 'development' | 'production' | 'test'): string {
  switch (nodeEnv) {
    case 'production': return 'info'
    case 'test': return 'warn'
    case 'development': return 'debug'
  }
}
