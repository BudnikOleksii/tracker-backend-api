DROP INDEX "UserAuthIdentity_userId_idx";--> statement-breakpoint
CREATE INDEX "UserAuthIdentity_userId_createdAt_idx" ON "UserAuthIdentity" USING btree ("userId","createdAt");