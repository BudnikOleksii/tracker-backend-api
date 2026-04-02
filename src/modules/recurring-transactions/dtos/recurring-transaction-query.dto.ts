import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { IsUUIDField } from '@/shared/decorators/validators.js';
import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';

import {
  CURRENCY_CODES,
  RECURRING_FREQUENCIES,
  RECURRING_TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from '../recurring-transactions.constants.js';
import type {
  CurrencyCode,
  RecurringFrequency,
  RecurringTransactionStatus,
  TransactionType,
} from '../recurring-transactions.constants.js';

export class RecurringTransactionQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({
    example: 'ACTIVE',
    type: String,
    enum: RECURRING_TRANSACTION_STATUSES,
    enumName: 'RecurringTransactionStatus',
  })
  @IsOptional()
  @IsIn(RECURRING_TRANSACTION_STATUSES)
  status?: RecurringTransactionStatus;

  @ApiPropertyOptional({
    example: 'EXPENSE',
    type: String,
    enum: TRANSACTION_TYPES,
    enumName: 'TransactionType',
  })
  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: 'CurrencyCode',
  })
  @IsOptional()
  @IsIn(CURRENCY_CODES)
  currencyCode?: CurrencyCode;

  @ApiPropertyOptional({
    example: 'MONTHLY',
    type: String,
    enum: RECURRING_FREQUENCIES,
    enumName: 'RecurringFrequency',
  })
  @IsOptional()
  @IsIn(RECURRING_FREQUENCIES)
  frequency?: RecurringFrequency;
}
