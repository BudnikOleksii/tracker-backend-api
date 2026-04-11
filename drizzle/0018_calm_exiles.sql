DROP INDEX "AuditLog_actorId_idx";--> statement-breakpoint
DROP INDEX "AuditLog_createdAt_idx";--> statement-breakpoint
DROP INDEX "LoginLog_userId_idx";--> statement-breakpoint
DROP INDEX "LoginLog_createdAt_idx";--> statement-breakpoint
DROP INDEX "RecurringTransaction_status_idx";--> statement-breakpoint
DROP INDEX "RecurringTransaction_nextOccurrenceDate_idx";--> statement-breakpoint
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog" USING btree ("actorId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "LoginLog_userId_createdAt_idx" ON "LoginLog" USING btree ("userId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "RecurringTransaction_status_nextOccurrenceDate_idx" ON "RecurringTransaction" USING btree ("status","nextOccurrenceDate") WHERE status = 'ACTIVE';--> statement-breakpoint
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_endDate_after_startDate" CHECK ("endDate" IS NULL OR "endDate" > "startDate");--> statement-breakpoint
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON "Transaction" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON "Budget" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON "RecurringTransaction" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON "RefreshToken" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON "Verification" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON "TransactionCategory" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON "DefaultTransactionCategory" FOR EACH ROW EXECUTE FUNCTION set_updated_at();