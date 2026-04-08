import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';

import type { TransactionMutationEvent } from './events/transaction-mutation.event.js';
import { CACHE_MODULE } from './transactions.constants.js';

@Injectable()
export class TransactionsCacheListener {
  private readonly logger = new Logger(TransactionsCacheListener.name);

  constructor(private readonly cacheService: CacheService) {}

  @OnEvent('transaction.bulk-processed', { async: true })
  async handleBulkProcessed(event: TransactionMutationEvent): Promise<void> {
    try {
      await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, event.userId));
    } catch (error) {
      this.logger.error(
        `Failed to invalidate transactions cache for user ${event.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
