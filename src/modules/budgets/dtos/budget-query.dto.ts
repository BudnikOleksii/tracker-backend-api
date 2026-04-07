import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { SORT_ORDERS } from '@/shared/constants/sort.constants.js';
import type { SortOrder } from '@/shared/constants/sort.constants.js';
import { IsUUIDField } from '@/shared/decorators/validators.js';
import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';
import { BUDGET_PERIODS, BUDGET_STATUSES } from '@/shared/enums/budget.enum.js';
import type { BudgetPeriod, BudgetStatus } from '@/shared/enums/budget.enum.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';

import { SORT_BY_FIELDS } from '../budgets.constants.js';
import type { SortByField } from '../budgets.constants.js';

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

  @ApiPropertyOptional({
    example: 'createdAt',
    type: String,
    enum: SORT_BY_FIELDS,
    enumName: 'BudgetSortBy',
    description: 'Field to sort by (default: createdAt)',
  })
  @IsOptional()
  @IsIn(SORT_BY_FIELDS)
  sortBy?: SortByField;

  @ApiPropertyOptional({
    example: 'desc',
    type: String,
    enum: SORT_ORDERS,
    enumName: 'SortOrder',
    description: 'Sort direction (default: desc)',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: SortOrder;
}
