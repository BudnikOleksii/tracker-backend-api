import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import {
  IsISO8601Field,
  IsNotBeforeField,
  IsStringField,
  IsUUIDField,
  MaxLengthField,
} from '@/shared/decorators/validators.js';
import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import { TRANSACTION_TYPES } from '@/shared/enums/transaction-type.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';
import { SORT_ORDERS } from '@/shared/constants/sort.constants.js';
import type { SortOrder } from '@/shared/constants/sort.constants.js';
import { SORT_BY_FIELDS } from '@/modules/transactions/transactions.constants.js';
import type { SortByField } from '@/modules/transactions/transactions.constants.js';

export class TransactionQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({
    example: 'grocery',
    description: 'Search transactions by description (case-insensitive)',
  })
  @IsOptional()
  @IsStringField()
  @MaxLengthField(200)
  search?: string;

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

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000+02:00' })
  @IsOptional()
  @IsISO8601Field()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.999+02:00' })
  @IsOptional()
  @IsISO8601Field()
  @IsNotBeforeField('dateFrom')
  dateTo?: string;

  @ApiPropertyOptional({
    example: 'date',
    type: String,
    enum: SORT_BY_FIELDS,
    enumName: 'TransactionSortBy',
    description: 'Field to sort by (default: date)',
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
