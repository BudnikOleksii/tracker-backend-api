import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';
import { IsUUIDField } from '@/shared/decorators/validators.js';

import { TRANSACTION_TYPES } from '../transaction-categories.constants.js';
import type { TransactionType } from '../transaction-categories.constants.js';

export class CategoryQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ example: 'EXPENSE', enum: TRANSACTION_TYPES, enumName: 'TransactionType' })
  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  parentCategoryId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @Transform(({ value }) => value === 'true' || value === true)
  root?: boolean;
}
