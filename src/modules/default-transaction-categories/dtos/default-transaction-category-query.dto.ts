import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';
import { TRANSACTION_TYPES } from '@/shared/enums/transaction-type.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

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
  @Type(() => Boolean)
  @Transform(({ value }) => value === 'true' || value === true)
  root?: boolean;
}
