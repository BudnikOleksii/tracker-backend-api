CREATE TABLE "UserAuthIdentity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"provider" "AuthProvider" NOT NULL,
	"providerId" text,
	"emailAtLink" text,
	"createdAt" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "UserAuthIdentity" ADD CONSTRAINT "UserAuthIdentity_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "UserAuthIdentity_provider_providerId_unique" ON "UserAuthIdentity" USING btree ("provider","providerId") WHERE "UserAuthIdentity"."providerId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "UserAuthIdentity_userId_local_unique" ON "UserAuthIdentity" USING btree ("userId","provider") WHERE "UserAuthIdentity"."provider" = 'LOCAL';--> statement-breakpoint
CREATE INDEX "UserAuthIdentity_userId_idx" ON "UserAuthIdentity" USING btree ("userId");--> statement-breakpoint
INSERT INTO "UserAuthIdentity" ("userId", "provider", "providerId", "emailAtLink")
SELECT "id", "authProvider", "authProviderId", "email"
FROM "User"
WHERE "authProviderId" IS NOT NULL;--> statement-breakpoint
INSERT INTO "UserAuthIdentity" ("userId", "provider", "providerId", "emailAtLink")
SELECT "id", 'LOCAL', NULL, "email"
FROM "User"
WHERE "passwordHash" IS NOT NULL;--> statement-breakpoint
DROP INDEX "User_authProvider_authProviderId_unique";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "authProvider";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "authProviderId";