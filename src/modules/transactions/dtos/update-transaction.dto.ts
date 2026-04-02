import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import {
  IsISO8601Field,
  IsNotEmptyField,
  IsStringField,
  IsUUIDField,
  MaxLengthField,
  MatchesField,
} from '@/shared/decorators/validators.js';

import { CURRENCY_CODES, TRANSACTION_TYPES } from '../transactions.constants.js';
import type { CurrencyCode, TransactionType } from '../transactions.constants.js';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'EXPENSE',
    type: String,
    enum: TRANSACTION_TYPES,
    enumName: 'TransactionType',
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
    enumName: 'CurrencyCode',
  })
  @IsOptional()
  @IsIn(CURRENCY_CODES)
  currencyCode?: CurrencyCode;

  @ApiPropertyOptional({ example: '2026-03-15T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601Field()
  date?: string;

  @ApiPropertyOptional({ example: 'Weekly grocery shopping' })
  @IsOptional()
  @IsStringField()
  @MaxLengthField(500)
  description?: string;
}
