import { relations } from 'drizzle-orm';

import { usersTable } from './schemas/users.js';
import { sessionsTable } from './schemas/sessions.js';

export const usersRelations = relations(usersTable, ({ many }) => ({
  sessions: many(sessionsTable),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));
