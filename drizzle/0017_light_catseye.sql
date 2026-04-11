ALTER TABLE "Budget" ALTER COLUMN "currencyCode" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "RecurringTransaction" ALTER COLUMN "currencyCode" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "Transaction" ALTER COLUMN "currencyCode" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "countryCode" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "baseCurrencyCode" SET DATA TYPE varchar(3);--> statement-breakpoint
DROP TYPE "public"."CountryCode";--> statement-breakpoint
DROP TYPE "public"."CurrencyCode";