DROP INDEX "Verification_identifier_idx";--> statement-breakpoint
CREATE INDEX "Budget_userId_status_idx" ON "Budget" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX "Budget_userId_currencyCode_startDate_endDate_idx" ON "Budget" USING btree ("userId","currencyCode","startDate","endDate");--> statement-breakpoint
CREATE INDEX "Transaction_userId_currencyCode_date_expense_idx" ON "Transaction" USING btree ("userId","currencyCode","date" DESC NULLS LAST) WHERE type = 'EXPENSE';--> statement-breakpoint
CREATE UNIQUE INDEX "Verification_identifier_key" ON "Verification" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_amount_positive" CHECK ("Budget"."amount" > 0);--> statement-breakpoint
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_amount_positive" CHECK ("RecurringTransaction"."amount" > 0);