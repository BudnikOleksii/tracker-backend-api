ALTER TABLE "Budget" ALTER COLUMN "startDate" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "Budget" ALTER COLUMN "endDate" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "RecurringTransaction" ALTER COLUMN "startDate" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "RecurringTransaction" ALTER COLUMN "endDate" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "RecurringTransaction" ALTER COLUMN "nextOccurrenceDate" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "Transaction" ALTER COLUMN "date" SET DATA TYPE timestamp (3) with time zone;