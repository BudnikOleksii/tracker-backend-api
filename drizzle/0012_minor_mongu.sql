CREATE TYPE "public"."AuthProvider" AS ENUM('LOCAL', 'GOOGLE', 'GITHUB');--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "authProvider" "AuthProvider" DEFAULT 'LOCAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "authProviderId" text;--> statement-breakpoint
CREATE UNIQUE INDEX "User_authProvider_authProviderId_unique" ON "User" USING btree ("authProvider","authProviderId") WHERE "User"."authProviderId" IS NOT NULL;