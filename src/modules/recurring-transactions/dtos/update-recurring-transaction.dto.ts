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

export class UpdateRecurringTransactionDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'EXPENSE', enum: TRANSACTION_TYPES, enumName: 'TransactionType' })
  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '49.99' })
  @IsOptional()
  @IsStringField()
  @IsNotEmptyField()
  @MatchesField(/^\d{1,17}(\.\d{1,2})?$/)
  amount?: string;

  @ApiPropertyOptional({ example: 'USD', enum: CURRENCY_CODES, enumName: 'CurrencyCode' })
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
    enum: RECURRING_FREQUENCIES,
    enumName: 'RecurringFrequency',
  })
  @IsOptional()
  @IsIn(RECURRING_FREQUENCIES)
  frequency?: RecurringFrequency;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsIntField()
  @MinField(1)
  interval?: number;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601Field()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601Field()
  endDate?: string;
}
