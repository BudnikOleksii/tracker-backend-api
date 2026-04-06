DROP INDEX "DefaultTransactionCategory_name_type_parentDefaultTransactionCategoryId_key";--> statement-breakpoint
DROP INDEX "TransactionCategory_userId_name_type_parentCategoryId_key";--> statement-breakpoint
ALTER TABLE "DefaultTransactionCategory" ADD CONSTRAINT "DefaultTransactionCategory_name_type_parentDefaultTransactionCategoryId_key" UNIQUE NULLS NOT DISTINCT("name","type","parentDefaultTransactionCategoryId");--> statement-breakpoint
ALTER TABLE "TransactionCategory" ADD CONSTRAINT "TransactionCategory_userId_name_type_parentCategoryId_key" UNIQUE NULLS NOT DISTINCT("userId","name","type","parentCategoryId");--> statement-breakpoint
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_endDate_after_startDate" CHECK ("endDate" > "startDate");--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_amount_positive" CHECK (amount > 0);