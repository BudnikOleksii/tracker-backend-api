import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';

import { RefreshTokenRepository } from '../auth/refresh-token.repository.js';

const HEARTBEAT_INTERVAL = 30_000;
const ON_START_TIMEOUT = 5000;

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(private readonly refreshTokenRepo: RefreshTokenRepository) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredSessions(): Promise<void> {
    const deleted = await this.refreshTokenRepo.deleteExpired();
    this.logger.log(`Cleaned ${deleted} expired session(s)`);
  }

  @Interval(HEARTBEAT_INTERVAL)
  heartbeat(): void {
    this.logger.debug('Heartbeat: application is alive');
  }

  @Timeout(ON_START_TIMEOUT)
  onStartup(): void {
    this.logger.log('Startup task executed 5 seconds after boot');
  }
}
