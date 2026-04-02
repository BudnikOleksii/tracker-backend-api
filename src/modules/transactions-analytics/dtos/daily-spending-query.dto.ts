import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import { TRANSACTION_TYPES } from '@/shared/enums/transaction-type.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

export class DailySpendingQueryDto {
  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ example: 'USD', type: String, enum: CURRENCY_CODES, enumName: 'CurrencyCode' })
  @IsIn(CURRENCY_CODES)
  currencyCode!: CurrencyCode;

  @ApiPropertyOptional({
    example: 'EXPENSE',
    type: String,
    enum: TRANSACTION_TYPES,
    enumName: 'TransactionType',
  })
  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;
}
