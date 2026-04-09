import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

import { SORT_ORDERS } from '@/shared/constants/sort.constants.js';
import type { SortOrder } from '@/shared/constants/sort.constants.js';
import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';
import { IsBooleanField } from '@/shared/decorators/validators.js';
import { TRANSACTION_TYPES } from '@/shared/enums/transaction-type.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

import { SORT_BY_FIELDS } from '../default-transaction-categories.constants.js';
import type { SortByField } from '../default-transaction-categories.constants.js';

export class DefaultTransactionCategoryQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({
    example: 'EXPENSE',
    type: String,
    enum: TRANSACTION_TYPES,
    enumName: 'TransactionType',
  })
  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) {
      return true;
    }
    if (value === 'false' || value === false) {
      return false;
    }

    return value;
  })
  @IsBooleanField()
  root?: boolean;

  @ApiPropertyOptional({
    example: 'name',
    type: String,
    enum: SORT_BY_FIELDS,
    enumName: 'DefaultCategorySortBy',
    description: 'Field to sort by (default: name)',
  })
  @IsOptional()
  @IsIn(SORT_BY_FIELDS)
  sortBy?: SortByField;

  @ApiPropertyOptional({
    example: 'asc',
    type: String,
    enum: SORT_ORDERS,
    enumName: 'SortOrder',
    description: 'Sort direction (default: asc)',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: SortOrder;
}
