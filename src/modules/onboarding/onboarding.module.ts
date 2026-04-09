import { Module } from '@nestjs/common';

import { DefaultTransactionCategoriesModule } from '../default-transaction-categories/default-transaction-categories.module.js';
import { TransactionCategoriesModule } from '../transaction-categories/transaction-categories.module.js';
import { UserModule } from '../user/user.module.js';
import { OnboardingController } from './onboarding.controller.js';
import { OnboardingService } from './onboarding.service.js';

@Module({
  imports: [UserModule, TransactionCategoriesModule, DefaultTransactionCategoriesModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
