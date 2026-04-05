DROP INDEX "RefreshToken_token_idx";--> statement-breakpoint
DROP INDEX "User_email_idx";--> statement-breakpoint
CREATE INDEX "Budget_status_endDate_idx" ON "Budget" USING btree ("status","endDate") WHERE status IN ('ACTIVE', 'EXCEEDED');--> statement-breakpoint
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction" USING btree ("userId","date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "Transaction_userId_currencyCode_date_idx" ON "Transaction" USING btree ("userId","currencyCode","date" DESC NULLS LAST);