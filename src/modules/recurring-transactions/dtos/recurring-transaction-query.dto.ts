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
  @ApiPropertyOptional({ example: 'ACTIVE', enum: RECURRING_TRANSACTION_STATUSES })
  @IsOptional()
  @IsIn(RECURRING_TRANSACTION_STATUSES)
  status?: RecurringTransactionStatus;

  @ApiPropertyOptional({ example: 'EXPENSE', enum: TRANSACTION_TYPES })
  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'USD', enum: CURRENCY_CODES })
  @IsOptional()
  @IsIn(CURRENCY_CODES)
  currencyCode?: CurrencyCode;

  @ApiPropertyOptional({ example: 'MONTHLY', enum: RECURRING_FREQUENCIES })
  @IsOptional()
  @IsIn(RECURRING_FREQUENCIES)
  frequency?: RecurringFrequency;
}
