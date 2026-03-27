import { ApiProperty } from '@nestjs/swagger';

import { OffsetListResponseDto } from '@/shared/dtos/list-response.dto.js';

import { RecurringTransactionResponseDto } from './recurring-transaction-response.dto.js';

export class RecurringTransactionListResponseDto extends OffsetListResponseDto<RecurringTransactionResponseDto> {
  @ApiProperty({
    description: 'List of recurring transactions',
    type: [RecurringTransactionResponseDto],
  })
  declare data: RecurringTransactionResponseDto[];
}
