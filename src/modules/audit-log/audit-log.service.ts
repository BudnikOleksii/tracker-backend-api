import { Injectable, Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

import { AuditLogRepository } from './audit-log.repository.js';
import type { AuditLogListQuery, AuditLogListResult } from './audit-log.repository.js';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    private readonly repo: AuditLogRepository,
    private readonly cls: ClsService,
  ) {}

  async log(data: {
    action: string;
    actorId?: string;
    actorEmail?: string;
    resourceId?: string;
    resourceType?: string;
    detail?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.repo.create({
        ...data,
        ipAddress: this.cls.get<string>('ip'),
        userAgent: this.cls.get<string>('userAgent'),
        requestId: this.cls.getId(),
      });
    } catch (error) {
      this.logger.error('Audit log write failed', error);
    }
  }

  async findAll(query: AuditLogListQuery): Promise<AuditLogListResult> {
    return this.repo.findAll(query);
  }
}
