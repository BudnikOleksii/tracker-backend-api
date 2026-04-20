import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateRecurringTransactionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUIDField()
  categoryId!: string;

  @ApiProperty({
    example: 'EXPENSE',
    type: String,
    enum: TRANSACTION_TYPES,
    enumName: ENUM_NAMES.TRANSACTION_TYPE,
  })
  @IsIn(TRANSACTION_TYPES)
  type!: TransactionType;

  @ApiProperty({ example: '49.99' })
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

  @ApiPropertyOptional({ example: 'Monthly rent payment' })
  @IsOptional()
  @IsStringField()
  @MaxLengthField(500)
  description?: string;

  @ApiProperty({
    example: 'MONTHLY',
    type: String,
    enum: RECURRING_FREQUENCIES,
    enumName: ENUM_NAMES.RECURRING_FREQUENCY,
  })
  @IsIn(RECURRING_FREQUENCIES)
  frequency!: RecurringFrequency;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsIntField()
  @MinField(1)
  @MaxField(365)
  interval?: number;

  @ApiProperty({ example: '2026-04-01T00:00:00.000+02:00' })
  @IsISO8601Field()
  startDate!: string;

  @ApiPropertyOptional({ example: '2027-04-01T00:00:00.000+02:00' })
  @IsOptional()
  @IsISO8601Field()
  endDate?: string;
}
