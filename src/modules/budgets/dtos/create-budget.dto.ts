import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import {
  IsISO8601Field,
  IsNotBeforeField,
  IsNotEmptyField,
  IsStringField,
  IsUUIDField,
  MatchesField,
  MaxLengthField,
} from '@/shared/decorators/validators.js';
import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
import { BUDGET_PERIODS } from '@/shared/enums/budget.enum.js';
import type { BudgetPeriod } from '@/shared/enums/budget.enum.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';

export class CreateBudgetDto {
  @ApiProperty({ example: '500.00' })
  @IsStringField()
  @IsNotEmptyField()
  @MatchesField(/^(?!0+(?:\.0{1,2})?$)\d{1,17}(\.\d{1,2})?$/)
  amount!: string;

  @ApiProperty({
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: ENUM_NAMES.CURRENCY_CODE,
  })
  @IsIn(CURRENCY_CODES)
  currencyCode!: CurrencyCode;

  @ApiProperty({
    example: 'MONTHLY',
    type: String,
    enum: BUDGET_PERIODS,
    enumName: ENUM_NAMES.BUDGET_PERIOD,
  })
  @IsIn(BUDGET_PERIODS)
  period!: BudgetPeriod;

  @ApiProperty({ example: '2026-03-01T00:00:00.000+02:00' })
  @IsISO8601Field()
  startDate!: string;

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.999+02:00' })
  @IsOptional()
  @IsISO8601Field()
  @IsNotBeforeField('startDate')
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
