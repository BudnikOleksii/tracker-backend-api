import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import {
  IsISO8601Field,
  IsInField,
  IsNotBeforeField,
  IsUUIDField,
} from '@/shared/decorators/validators.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import { TRANSACTION_TYPES } from '@/shared/enums/transaction-type.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: 'CurrencyCode',
  })
  @IsOptional()
  @IsInField([...CURRENCY_CODES])
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
    example: 'EXPENSE',
    type: String,
    enum: TRANSACTION_TYPES,
    enumName: 'TransactionType',
  })
  @IsOptional()
  @IsInField([...TRANSACTION_TYPES])
  type?: TransactionType;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;
}
