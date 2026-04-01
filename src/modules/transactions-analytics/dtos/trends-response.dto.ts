import { ApiProperty } from '@nestjs/swagger';

import { CURRENCY_CODES } from '@/modules/transactions/transactions.constants.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';

import { GRANULARITY_VALUES } from './trends-query.dto.js';
import type { Granularity } from './trends-query.dto.js';

export class TrendPeriodDto {
  @ApiProperty({ description: 'Period start date', example: '2026-03-01' })
  periodStart: string;

  @ApiProperty({ description: 'Period end date', example: '2026-03-31' })
  periodEnd: string;

  @ApiProperty({ description: 'Total income for this period', example: '2500.00' })
  totalIncome: string;

  @ApiProperty({ description: 'Total expenses for this period', example: '1800.50' })
  totalExpenses: string;

  @ApiProperty({ description: 'Net balance for this period', example: '699.50' })
  netBalance: string;

  @ApiProperty({ description: 'Number of transactions in this period', example: 15 })
  transactionCount: number;
}

export class TrendsResponseDto {
  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    enum: CURRENCY_CODES,
    enumName: 'CurrencyCode',
  })
  currencyCode: CurrencyCode;

  @ApiProperty({
    description: 'Time granularity',
    example: 'monthly',
    enum: GRANULARITY_VALUES,
    enumName: 'Granularity',
  })
  granularity: Granularity;

  @ApiProperty({ description: 'Trend periods data', type: [TrendPeriodDto] })
  periods: TrendPeriodDto[];
}
