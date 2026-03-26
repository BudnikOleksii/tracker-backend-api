import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import {
  IsISO8601Field,
  IsNotEmptyField,
  IsStringField,
  IsUUIDField,
  MatchesField,
  MaxLengthField,
} from '@/shared/decorators/validators.js';

import { BUDGET_PERIODS, CURRENCY_CODES } from '../budgets.constants.js';
import type { BudgetPeriod, CurrencyCode } from '../budgets.constants.js';

export class CreateBudgetDto {
  @ApiProperty({ example: '500.00' })
  @IsStringField()
  @IsNotEmptyField()
  @MatchesField(/^\d{1,17}(\.\d{1,2})?$/)
  amount!: string;

  @ApiProperty({ example: 'USD', enum: CURRENCY_CODES, enumName: 'CurrencyCode' })
  @IsIn(CURRENCY_CODES)
  currencyCode!: CurrencyCode;

  @ApiProperty({ example: 'MONTHLY', enum: BUDGET_PERIODS, enumName: 'BudgetPeriod' })
  @IsIn(BUDGET_PERIODS)
  period!: BudgetPeriod;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  @IsISO8601Field()
  startDate!: string;

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.999Z' })
  @IsOptional()
  @IsISO8601Field()
  endDate?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Monthly grocery budget' })
  @IsOptional()
  @IsStringField()
  @MaxLengthField(500)
  description?: string;
}
