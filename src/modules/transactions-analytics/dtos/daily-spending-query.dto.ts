import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

import { IsInField, IsIntField, MaxField, MinField } from '@/shared/decorators/validators.js';
import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import { TRANSACTION_TYPES } from '@/shared/enums/transaction-type.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

export class DailySpendingQueryDto {
  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsIntField()
  @MinField(2000)
  @MaxField(2100)
  year!: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsIntField()
  @MinField(1)
  @MaxField(12)
  month!: number;

  @ApiPropertyOptional({
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: ENUM_NAMES.CURRENCY_CODE,
  })
  @IsOptional()
  @IsInField([...CURRENCY_CODES])
  currencyCode?: CurrencyCode;

  @ApiPropertyOptional({
    example: 'EXPENSE',
    type: String,
    enum: TRANSACTION_TYPES,
    enumName: ENUM_NAMES.TRANSACTION_TYPE,
  })
  @IsOptional()
  @IsInField([...TRANSACTION_TYPES])
  type?: TransactionType;
}
