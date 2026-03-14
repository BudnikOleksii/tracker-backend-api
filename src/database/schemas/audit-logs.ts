import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable(
  'AuditLog',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    action: text('action').notNull(),
    actorId: text('actorId'),
    actorEmail: text('actorEmail'),
    resourceType: text('resourceType'),
    resourceId: text('resourceId'),
    detail: jsonb('detail'),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    requestId: text('requestId'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('AuditLog_actorId_idx').on(table.actorId),
    index('AuditLog_action_idx').on(table.action),
    index('AuditLog_createdAt_idx').on(table.createdAt),
  ],
);
