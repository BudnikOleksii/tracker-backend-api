import { ApiProperty } from '@nestjs/swagger';

import { OffsetListResponseDto } from '@/shared/dtos/list-response.dto.js';

import { BudgetResponseDto } from './budget-response.dto.js';

export class BudgetListResponseDto extends OffsetListResponseDto<BudgetResponseDto> {
  @ApiProperty({ description: 'List of budgets', type: [BudgetResponseDto] })
  declare data: BudgetResponseDto[];
}
