import type { InjectionToken, ModuleMetadata } from '@nestjs/common'
import type * as schema from './schemas/index.js'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

export const DB_TOKEN = Symbol('DB_TOKEN')

export type DrizzleDb = NodePgDatabase<typeof schema>

export type Schema = typeof schema

export interface DrizzlePoolOptions {
  max?: number
  min?: number
  idleTimeoutMillis?: number
  connectionTimeoutMillis?: number
}

export interface DrizzleModuleOptions {
  connectionString: string
  pool?: DrizzlePoolOptions
}

export interface DrizzleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: InjectionToken[]
  useFactory: (
    ...args: unknown[]
  ) => DrizzleModuleOptions | Promise<DrizzleModuleOptions>
}
