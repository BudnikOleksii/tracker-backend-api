import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import {
  IsISO8601Field,
  IsNotEmptyField,
  IsStringField,
  IsUUIDField,
  MaxLengthField,
  MatchesField,
} from '@/shared/decorators/validators.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import { TRANSACTION_TYPES } from '@/shared/enums/transaction-type.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

export class CreateTransactionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUIDField()
  categoryId!: string;

  @ApiProperty({
    example: 'EXPENSE',
    type: String,
    enum: TRANSACTION_TYPES,
    enumName: 'TransactionType',
  })
  @IsIn(TRANSACTION_TYPES)
  type!: TransactionType;

  @ApiProperty({ example: '49.99' })
  @IsStringField()
  @IsNotEmptyField()
  @MatchesField(/^\d{1,17}(\.\d{1,2})?$/)
  amount!: string;

  @ApiProperty({ example: 'USD', type: String, enum: CURRENCY_CODES, enumName: 'CurrencyCode' })
  @IsIn(CURRENCY_CODES)
  currencyCode!: CurrencyCode;

  @ApiProperty({ example: '2026-03-15T00:00:00.000+02:00' })
  @IsISO8601Field()
  date!: string;

  @ApiPropertyOptional({ example: 'Weekly grocery shopping' })
  @IsOptional()
  @IsStringField()
  @MaxLengthField(500)
  description?: string;
}
