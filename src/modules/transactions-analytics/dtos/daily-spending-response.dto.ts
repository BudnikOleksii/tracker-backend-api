import { ApiProperty } from '@nestjs/swagger';

import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';

class DailySpendingItemDto {
  @ApiProperty({ description: 'Date', example: '2026-03-15' })
  date: string;

  @ApiProperty({ description: 'Total amount for this day', example: '45.99' })
  total: string;

  @ApiProperty({ description: 'Number of transactions on this day', example: 3 })
  transactionCount: number;
}

export class DailySpendingResponseDto {
  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: 'CurrencyCode',
  })
  currencyCode: CurrencyCode;

  @ApiProperty({ description: 'Year', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Month (1-12)', example: 3 })
  month: number;

  @ApiProperty({
    description: 'Daily spending data',
    type: [DailySpendingItemDto],
    example: [
      { date: '2026-03-01', total: '45.99', transactionCount: 3 },
      { date: '2026-03-02', total: '0.00', transactionCount: 0 },
    ],
  })
  days: DailySpendingItemDto[];
}
