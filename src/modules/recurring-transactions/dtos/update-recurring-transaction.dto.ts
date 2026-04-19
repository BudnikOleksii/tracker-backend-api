import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

import {
  IsISO8601Field,
  IsIntField,
  IsNotEmptyField,
  IsStringField,
  IsUUIDField,
  MatchesField,
  MaxField,
  MaxLengthField,
  MinField,
} from '@/shared/decorators/validators.js';
import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import { RECURRING_FREQUENCIES } from '@/shared/enums/recurring-frequency.enum.js';
import type { RecurringFrequency } from '@/shared/enums/recurring-frequency.enum.js';
import { TRANSACTION_TYPES } from '@/shared/enums/transaction-type.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

export class UpdateRecurringTransactionDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'EXPENSE',
    type: String,
    enum: TRANSACTION_TYPES,
    enumName: ENUM_NAMES.TRANSACTION_TYPE,
  })
  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '49.99' })
  @IsOptional()
  @IsStringField()
  @IsNotEmptyField()
  @MatchesField(/^\d{1,17}(\.\d{1,2})?$/)
  amount?: string;

  @ApiPropertyOptional({
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: ENUM_NAMES.CURRENCY_CODE,
  })
  @IsOptional()
  @IsIn(CURRENCY_CODES)
  currencyCode?: CurrencyCode;

  @ApiPropertyOptional({ example: 'Monthly rent payment' })
  @IsOptional()
  @IsStringField()
  @MaxLengthField(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'MONTHLY',
    type: String,
    enum: RECURRING_FREQUENCIES,
    enumName: ENUM_NAMES.RECURRING_FREQUENCY,
  })
  @IsOptional()
  @IsIn(RECURRING_FREQUENCIES)
  frequency?: RecurringFrequency;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsIntField()
  @MinField(1)
  @MaxField(365)
  interval?: number;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000+02:00' })
  @IsOptional()
  @IsISO8601Field()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-04-01T00:00:00.000+02:00' })
  @IsOptional()
  @IsISO8601Field()
  endDate?: string;
}
