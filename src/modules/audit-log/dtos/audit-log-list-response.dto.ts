import { ApiProperty } from '@nestjs/swagger';

import { OffsetListResponseDto } from '@/shared/dtos/list-response.dto.js';

import { AuditLogResponseDto } from './audit-log-response.dto.js';

export class AuditLogListResponseDto extends OffsetListResponseDto<AuditLogResponseDto> {
  @ApiProperty({ description: 'List of audit log entries', type: [AuditLogResponseDto] })
  declare data: AuditLogResponseDto[];
}
