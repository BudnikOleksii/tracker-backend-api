import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import {
  IsNotEmptyField,
  IsStringField,
  IsUUIDField,
  MaxLengthField,
} from '@/shared/decorators/validators.js';

import { TRANSACTION_TYPES } from '../transaction-categories.constants.js';
import type { TransactionType } from '../transaction-categories.constants.js';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Groceries' })
  @IsStringField()
  @IsNotEmptyField()
  @MaxLengthField(100)
  name!: string;

  @ApiProperty({ example: 'EXPENSE', enum: TRANSACTION_TYPES })
  @IsIn(TRANSACTION_TYPES)
  type!: TransactionType;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  parentCategoryId?: string;
}
