import { ApiProperty } from '@nestjs/swagger';

import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';
import { TRANSACTION_TYPES } from '@/shared/enums/transaction-type.enum.js';

export class DefaultTransactionCategoryResponseDto {
  @ApiProperty({
    description: 'Default transaction category ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ description: 'Category name', example: 'Groceries' })
  name: string;

  @ApiProperty({
    description: 'Category type',
    example: 'EXPENSE',
    type: String,
    enum: TRANSACTION_TYPES,
    enumName: 'TransactionType',
  })
  type: TransactionType;

  @ApiProperty({
    description: 'Parent default transaction category ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    type: String,
    nullable: true,
  })
  parentDefaultTransactionCategoryId: string | null;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-03-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2026-03-15T10:30:00.000Z' })
  updatedAt: Date;
}
