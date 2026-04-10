ALTER TABLE "LoginLog" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
UPDATE "LoginLog" SET "status" = UPPER("status");--> statement-breakpoint
DROP TYPE "public"."LoginStatus";--> statement-breakpoint
CREATE TYPE "public"."LoginStatus" AS ENUM('SUCCESS', 'FAILED');--> statement-breakpoint
ALTER TABLE "LoginLog" ALTER COLUMN "status" SET DATA TYPE "public"."LoginStatus" USING "status"::"public"."LoginStatus";
