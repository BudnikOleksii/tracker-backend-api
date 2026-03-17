CREATE TYPE "public"."BudgetPeriod" AS ENUM('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."BudgetStatus" AS ENUM('ACTIVE', 'EXCEEDED');--> statement-breakpoint
CREATE TABLE "Budget" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"categoryId" uuid,
	"amount" numeric(19, 2) NOT NULL,
	"currencyCode" "CurrencyCode" NOT NULL,
	"period" "BudgetPeriod" NOT NULL,
	"startDate" timestamp (3) NOT NULL,
	"endDate" timestamp (3) NOT NULL,
	"status" "BudgetStatus" DEFAULT 'ACTIVE' NOT NULL,
	"description" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_TransactionCategory_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."TransactionCategory"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Budget_userId_idx" ON "Budget" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Budget_categoryId_idx" ON "Budget" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "Budget_status_idx" ON "Budget" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Budget_startDate_endDate_idx" ON "Budget" USING btree ("startDate","endDate");