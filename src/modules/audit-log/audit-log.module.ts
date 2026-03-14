import { Global, Module } from '@nestjs/common'

import { AuditLogController } from './audit-log.controller.js'
import { AuditLogRepository } from './audit-log.repository.js'
import { AuditLogService } from './audit-log.service.js'

@Global()
@Module({
  controllers: [AuditLogController],
  providers: [
    AuditLogRepository,
    AuditLogService,
  ],
  exports: [AuditLogService],
})
export class AuditLogModule {}
