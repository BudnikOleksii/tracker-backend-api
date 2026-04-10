ALTER TABLE "DefaultTransactionCategory" DROP CONSTRAINT "DefaultTransactionCategory_name_type_parentDefaultTransactionCategoryId_key";--> statement-breakpoint
ALTER TABLE "TransactionCategory" DROP CONSTRAINT "TransactionCategory_userId_name_type_parentCategoryId_key";--> statement-breakpoint
ALTER TABLE "Budget" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "Budget" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Budget" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "Budget" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "DefaultTransactionCategory" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "DefaultTransactionCategory" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "DefaultTransactionCategory" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "DefaultTransactionCategory" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "DefaultTransactionCategory" ALTER COLUMN "deletedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "KnownDevice" ALTER COLUMN "firstSeenAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "KnownDevice" ALTER COLUMN "firstSeenAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "KnownDevice" ALTER COLUMN "lastSeenAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "KnownDevice" ALTER COLUMN "lastSeenAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "LoginLog" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "LoginLog" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "RecurringTransaction" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "RecurringTransaction" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "RecurringTransaction" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "RecurringTransaction" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "RefreshToken" ALTER COLUMN "expiresAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "RefreshToken" ALTER COLUMN "revokedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "RefreshToken" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "RefreshToken" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "RefreshToken" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "RefreshToken" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "TransactionCategory" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "TransactionCategory" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "TransactionCategory" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "TransactionCategory" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "TransactionCategory" ALTER COLUMN "deletedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "Transaction" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "Transaction" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Transaction" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "Transaction" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "emailVerificationTokenExpiresAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "deletedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "Verification" ALTER COLUMN "expiresAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "Verification" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "Verification" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Verification" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "Verification" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
CREATE UNIQUE INDEX "DefaultTransactionCategory_name_type_parentDefaultTransactionCategoryId_key" ON "DefaultTransactionCategory" USING btree ("name","type","parentDefaultTransactionCategoryId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "TransactionCategory_userId_name_type_parentCategoryId_key" ON "TransactionCategory" USING btree ("userId","name","type","parentCategoryId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "TransactionCategory_userId_not_deleted_idx" ON "TransactionCategory" USING btree ("userId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "Transaction_description_trgm_idx" ON "Transaction" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "User_id_not_deleted_idx" ON "User" USING btree ("id") WHERE "deletedAt" IS NULL;