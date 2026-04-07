import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { SORT_ORDERS } from '@/shared/constants/sort.constants.js';
import type { SortOrder } from '@/shared/constants/sort.constants.js';
import { IsUUIDField } from '@/shared/decorators/validators.js';
import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import { RECURRING_FREQUENCIES } from '@/shared/enums/recurring-frequency.enum.js';
import type { RecurringFrequency } from '@/shared/enums/recurring-frequency.enum.js';
import { RECURRING_TRANSACTION_STATUSES } from '@/shared/enums/recurring-transaction-status.enum.js';
import type { RecurringTransactionStatus } from '@/shared/enums/recurring-transaction-status.enum.js';
import { TRANSACTION_TYPES } from '@/shared/enums/transaction-type.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

import { SORT_BY_FIELDS } from '../recurring-transactions.constants.js';
import type { SortByField } from '../recurring-transactions.constants.js';

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

  @ApiPropertyOptional({
    example: 'createdAt',
    type: String,
    enum: SORT_BY_FIELDS,
    enumName: 'RecurringTransactionSortBy',
    description: 'Field to sort by (default: createdAt)',
  })
  @IsOptional()
  @IsIn(SORT_BY_FIELDS)
  sortBy?: SortByField;

  @ApiPropertyOptional({
    example: 'desc',
    type: String,
    enum: SORT_ORDERS,
    enumName: 'SortOrder',
    description: 'Sort direction (default: desc)',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: SortOrder;
}
