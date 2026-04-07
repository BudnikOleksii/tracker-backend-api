import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';
import type { TransactionMutationEvent } from '@/modules/transactions/events/transaction-mutation.event.js';

const CACHE_MODULE = 'budgets';

@Injectable()
export class BudgetsCacheListener {
  private readonly logger = new Logger(BudgetsCacheListener.name);

  constructor(private readonly cacheService: CacheService) {}

  @OnEvent('transaction.*', { async: true })
  async handleTransactionMutation(event: TransactionMutationEvent): Promise<void> {
    try {
      await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, event.userId));
    } catch (error) {
      this.logger.error(
        `Failed to invalidate budgets cache for user ${event.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
