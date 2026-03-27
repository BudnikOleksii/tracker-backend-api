import { ApiProperty } from '@nestjs/swagger';

import { OffsetListResponseDto } from '@/shared/dtos/list-response.dto.js';

import { TransactionResponseDto } from './transaction-response.dto.js';

export class TransactionListResponseDto extends OffsetListResponseDto<TransactionResponseDto> {
  @ApiProperty({ description: 'List of transactions', type: [TransactionResponseDto] })
  declare data: TransactionResponseDto[];
}
