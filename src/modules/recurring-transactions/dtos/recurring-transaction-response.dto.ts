import { ApiProperty } from '@nestjs/swagger';

import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import type { RecurringFrequency } from '@/shared/enums/recurring-frequency.enum.js';
import type { RecurringTransactionStatus } from '@/shared/enums/recurring-transaction-status.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

import {
  CURRENCY_CODES,
  RECURRING_FREQUENCIES,
  RECURRING_TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from '../recurring-transactions.constants.js';

export class RecurringTransactionResponseDto {
  @ApiProperty({
    description: 'Recurring transaction ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({ description: 'Category ID', example: '550e8400-e29b-41d4-a716-446655440002' })
  categoryId: string;

  @ApiProperty({
    description: 'Transaction type',
    example: 'EXPENSE',
    enum: TRANSACTION_TYPES,
    enumName: 'TransactionType',
  })
  type: TransactionType;

  @ApiProperty({ description: 'Transaction amount', example: '49.99' })
  amount: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    enum: CURRENCY_CODES,
    enumName: 'CurrencyCode',
  })
  currencyCode: CurrencyCode;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Monthly subscription',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Recurrence frequency',
    example: 'MONTHLY',
    enum: RECURRING_FREQUENCIES,
    enumName: 'RecurringFrequency',
  })
  frequency: RecurringFrequency;

  @ApiProperty({ description: 'Recurrence interval', example: 1 })
  interval: number;

  @ApiProperty({ description: 'Start date', example: '2026-01-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({
    description: 'End date',
    example: '2026-12-31T23:59:59.999Z',
    type: Date,
    nullable: true,
  })
  endDate: Date | null;

  @ApiProperty({ description: 'Next occurrence date', example: '2026-04-01T00:00:00.000Z' })
  nextOccurrenceDate: Date;

  @ApiProperty({
    description: 'Recurring transaction status',
    example: 'ACTIVE',
    enum: RECURRING_TRANSACTION_STATUSES,
    enumName: 'RecurringTransactionStatus',
  })
  status: RecurringTransactionStatus;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-01-01T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2026-01-01T10:30:00.000Z' })
  updatedAt: Date;
}
