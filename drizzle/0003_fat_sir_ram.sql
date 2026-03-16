CREATE TYPE "public"."RecurringFrequency" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');--> statement-breakpoint
CREATE TYPE "public"."RecurringTransactionStatus" AS ENUM('ACTIVE', 'PAUSED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "RecurringTransaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"categoryId" uuid NOT NULL,
	"type" "TransactionType" NOT NULL,
	"amount" numeric(19, 2) NOT NULL,
	"currencyCode" "CurrencyCode" NOT NULL,
	"description" text,
	"frequency" "RecurringFrequency" NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"startDate" timestamp (3) NOT NULL,
	"endDate" timestamp (3),
	"nextOccurrenceDate" timestamp (3) NOT NULL,
	"status" "RecurringTransactionStatus" DEFAULT 'ACTIVE' NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "recurringTransactionId" uuid;--> statement-breakpoint
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_userId_categoryId_TransactionCategory_userId_id_fk" FOREIGN KEY ("userId","categoryId") REFERENCES "public"."TransactionCategory"("userId","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "RecurringTransaction_userId_idx" ON "RecurringTransaction" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "RecurringTransaction_categoryId_idx" ON "RecurringTransaction" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "RecurringTransaction_status_idx" ON "RecurringTransaction" USING btree ("status");--> statement-breakpoint
CREATE INDEX "RecurringTransaction_nextOccurrenceDate_idx" ON "RecurringTransaction" USING btree ("nextOccurrenceDate");--> statement-breakpoint
CREATE INDEX "RecurringTransaction_type_idx" ON "RecurringTransaction" USING btree ("type");--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_recurringTransactionId_RecurringTransaction_id_fk" FOREIGN KEY ("recurringTransactionId") REFERENCES "public"."RecurringTransaction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Transaction_recurringTransactionId_idx" ON "Transaction" USING btree ("recurringTransactionId");