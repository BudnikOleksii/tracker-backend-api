import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { IsISO8601Field, IsUUIDField } from '@/shared/decorators/validators.js';
import {
  CURRENCY_CODES,
  TRANSACTION_TYPES,
} from '@/modules/transactions/transactions.constants.js';
import type {
  CurrencyCode,
  TransactionType,
} from '@/modules/transactions/transactions.constants.js';

export class AnalyticsQueryDto {
  @ApiProperty({ example: 'USD', enum: CURRENCY_CODES, enumName: 'CurrencyCode' })
  @IsIn(CURRENCY_CODES)
  currencyCode!: CurrencyCode;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601Field()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.999Z' })
  @IsOptional()
  @IsISO8601Field()
  dateTo?: string;

  @ApiPropertyOptional({ example: 'EXPENSE', enum: TRANSACTION_TYPES, enumName: 'TransactionType' })
  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;
}
