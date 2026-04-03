CREATE TABLE "DefaultTransactionCategory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "TransactionType" NOT NULL,
	"parentDefaultTransactionCategoryId" uuid,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	"deletedAt" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "DefaultTransactionCategory" ADD CONSTRAINT "DefaultTransactionCategory_parentDefaultTransactionCategoryId_DefaultTransactionCategory_id_fk" FOREIGN KEY ("parentDefaultTransactionCategoryId") REFERENCES "public"."DefaultTransactionCategory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "DefaultTransactionCategory_name_type_parentDefaultTransactionCategoryId_key" ON "DefaultTransactionCategory" USING btree ("name","type","parentDefaultTransactionCategoryId");--> statement-breakpoint
CREATE INDEX "DefaultTransactionCategory_type_idx" ON "DefaultTransactionCategory" USING btree ("type");--> statement-breakpoint
CREATE INDEX "DefaultTransactionCategory_parentDefaultTransactionCategoryId_idx" ON "DefaultTransactionCategory" USING btree ("parentDefaultTransactionCategoryId");