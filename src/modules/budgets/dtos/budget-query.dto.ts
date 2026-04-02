import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { IsUUIDField } from '@/shared/decorators/validators.js';
import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';

import { BUDGET_PERIODS, BUDGET_STATUSES, CURRENCY_CODES } from '../budgets.constants.js';
import type { BudgetPeriod, BudgetStatus, CurrencyCode } from '../budgets.constants.js';

export class BudgetQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({
    example: 'ACTIVE',
    type: String,
    enum: BUDGET_STATUSES,
    enumName: 'BudgetStatus',
  })
  @IsOptional()
  @IsIn(BUDGET_STATUSES)
  status?: BudgetStatus;

  @ApiPropertyOptional({
    example: 'MONTHLY',
    type: String,
    enum: BUDGET_PERIODS,
    enumName: 'BudgetPeriod',
  })
  @IsOptional()
  @IsIn(BUDGET_PERIODS)
  period?: BudgetPeriod;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: 'CurrencyCode',
  })
  @IsOptional()
  @IsIn(CURRENCY_CODES)
  currencyCode?: CurrencyCode;
}
