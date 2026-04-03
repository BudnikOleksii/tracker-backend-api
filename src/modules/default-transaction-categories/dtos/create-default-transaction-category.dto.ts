import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

import {
  IsNotEmptyField,
  IsStringField,
  IsUUIDField,
  MaxLengthField,
} from '@/shared/decorators/validators.js';
import { TRANSACTION_TYPES } from '@/shared/enums/transaction-type.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

export class CreateDefaultTransactionCategoryDto {
  @ApiProperty({ example: 'Groceries' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsStringField()
  @IsNotEmptyField()
  @MaxLengthField(100)
  name!: string;

  @ApiProperty({
    example: 'EXPENSE',
    type: String,
    enum: TRANSACTION_TYPES,
    enumName: 'TransactionType',
  })
  @IsIn(TRANSACTION_TYPES)
  type!: TransactionType;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  parentDefaultTransactionCategoryId?: string;
}
