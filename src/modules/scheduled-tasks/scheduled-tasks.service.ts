import { Injectable, Logger } from '@nestjs/common'
import { Cron, Interval, Timeout } from '@nestjs/schedule'

import { SessionRepository } from '../auth/session.repository.js'

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name)

  constructor(private readonly sessionRepo: SessionRepository) {}

  @Cron('0 * * * *')
  async cleanExpiredSessions(): Promise<void> {
    const deleted = await this.sessionRepo.deleteExpired()
    this.logger.log(`Cleaned ${deleted} expired session(s)`)
  }

  @Interval(30_000)
  heartbeat(): void {
    this.logger.debug('Heartbeat: application is alive')
  }

  @Timeout(5000)
  onStartup(): void {
    this.logger.log('Startup task executed 5 seconds after boot')
  }
}
