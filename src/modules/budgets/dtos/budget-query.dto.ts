import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { IsUUIDField } from '@/shared/decorators/validators.js';
import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';

import { BUDGET_PERIODS, BUDGET_STATUSES, CURRENCY_CODES } from '../budgets.constants.js';
import type { BudgetPeriod, BudgetStatus, CurrencyCode } from '../budgets.constants.js';

export class BudgetQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ example: 'ACTIVE', enum: BUDGET_STATUSES })
  @IsOptional()
  @IsIn(BUDGET_STATUSES)
  status?: BudgetStatus;

  @ApiPropertyOptional({ example: 'MONTHLY', enum: BUDGET_PERIODS })
  @IsOptional()
  @IsIn(BUDGET_PERIODS)
  period?: BudgetPeriod;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'USD', enum: CURRENCY_CODES })
  @IsOptional()
  @IsIn(CURRENCY_CODES)
  currencyCode?: CurrencyCode;
}
