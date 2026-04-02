import { ApiProperty } from '@nestjs/swagger';

import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

import { CURRENCY_CODES, TRANSACTION_TYPES } from '../transactions.constants.js';

export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Category ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  categoryId: string;

  @ApiProperty({
    description: 'Transaction type',
    example: 'EXPENSE',
    type: String,
    enum: TRANSACTION_TYPES,
    enumName: 'TransactionType',
  })
  type: TransactionType;

  @ApiProperty({ description: 'Transaction amount', example: '49.99' })
  amount: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: 'CurrencyCode',
  })
  currencyCode: CurrencyCode;

  @ApiProperty({ description: 'Transaction date', example: '2026-03-15T00:00:00.000Z' })
  date: Date;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Grocery shopping',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Linked recurring transaction ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
    type: String,
    nullable: true,
  })
  recurringTransactionId: string | null;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-03-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2026-03-15T10:30:00.000Z' })
  updatedAt: Date;
}
