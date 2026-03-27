import { ApiProperty } from '@nestjs/swagger';

import { BudgetResponseDto } from './budget-response.dto.js';

export class BudgetProgressResponseDto {
  @ApiProperty({ description: 'The budget details', type: BudgetResponseDto })
  budget: BudgetResponseDto;

  @ApiProperty({ description: 'Amount spent so far', example: '150.50' })
  spentAmount: string;

  @ApiProperty({ description: 'Remaining budget amount', example: '349.50' })
  remainingAmount: string;

  @ApiProperty({ description: 'Percentage of budget used', example: 30.1 })
  percentUsed: number;
}
