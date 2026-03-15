import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { IsStringField, IsUUIDField } from '@/shared/decorators/validators.js';
import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';

import { CURRENCY_CODES, TRANSACTION_TYPES } from '../transactions.constants.js';
import type { CurrencyCode, TransactionType } from '../transactions.constants.js';

export class TransactionQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ example: 'EXPENSE', enum: TRANSACTION_TYPES })
  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'USD', enum: CURRENCY_CODES })
  @IsOptional()
  @IsIn(CURRENCY_CODES)
  currencyCode?: CurrencyCode;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsStringField()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.999Z' })
  @IsOptional()
  @IsStringField()
  dateTo?: string;
}
