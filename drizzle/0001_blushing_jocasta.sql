ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_categoryId_TransactionCategory_id_fk";
--> statement-breakpoint
ALTER TABLE "AuditLog" ALTER COLUMN "createdAt" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "AuditLog" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_replacedByTokenId_RefreshToken_id_fk" FOREIGN KEY ("replacedByTokenId") REFERENCES "public"."RefreshToken"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionCategory" ADD CONSTRAINT "TransactionCategory_userId_id_key" UNIQUE("userId","id");--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_categoryId_TransactionCategory_userId_id_fk" FOREIGN KEY ("userId","categoryId") REFERENCES "public"."TransactionCategory"("userId","id") ON DELETE restrict ON UPDATE no action;