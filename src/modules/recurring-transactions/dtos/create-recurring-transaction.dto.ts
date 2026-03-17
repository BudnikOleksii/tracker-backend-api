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
  MaxLengthField,
  MinField,
} from '@/shared/decorators/validators.js';

import {
  CURRENCY_CODES,
  RECURRING_FREQUENCIES,
  TRANSACTION_TYPES,
} from '../recurring-transactions.constants.js';
import type {
  CurrencyCode,
  RecurringFrequency,
  TransactionType,
} from '../recurring-transactions.constants.js';

export class CreateRecurringTransactionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUIDField()
  categoryId!: string;

  @ApiProperty({ example: 'EXPENSE', enum: TRANSACTION_TYPES })
  @IsIn(TRANSACTION_TYPES)
  type!: TransactionType;

  @ApiProperty({ example: '49.99' })
  @IsStringField()
  @IsNotEmptyField()
  @MatchesField(/^\d{1,17}(\.\d{1,2})?$/)
  amount!: string;

  @ApiProperty({ example: 'USD', enum: CURRENCY_CODES })
  @IsIn(CURRENCY_CODES)
  currencyCode!: CurrencyCode;

  @ApiPropertyOptional({ example: 'Monthly rent payment' })
  @IsOptional()
  @IsStringField()
  @MaxLengthField(500)
  description?: string;

  @ApiProperty({ example: 'MONTHLY', enum: RECURRING_FREQUENCIES })
  @IsIn(RECURRING_FREQUENCIES)
  frequency!: RecurringFrequency;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsIntField()
  @MinField(1)
  interval?: number;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  @IsISO8601Field()
  startDate!: string;

  @ApiPropertyOptional({ example: '2027-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601Field()
  endDate?: string;
}
