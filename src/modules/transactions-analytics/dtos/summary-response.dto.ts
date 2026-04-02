import { ApiProperty } from '@nestjs/swagger';

import { CURRENCY_CODES } from '@/modules/transactions/transactions.constants.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';

export class SummaryResponseDto {
  @ApiProperty({ description: 'Total income amount', example: '5000.00' })
  totalIncome: string;

  @ApiProperty({ description: 'Total expenses amount', example: '3200.50' })
  totalExpenses: string;

  @ApiProperty({ description: 'Net balance (income - expenses)', example: '1799.50' })
  netBalance: string;

  @ApiProperty({ description: 'Total number of transactions', example: 42 })
  transactionCount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: 'CurrencyCode',
  })
  currencyCode: CurrencyCode;

  @ApiProperty({ description: 'Period start date', example: '2026-03-01T00:00:00.000Z' })
  dateFrom: string;

  @ApiProperty({ description: 'Period end date', example: '2026-03-31T23:59:59.999Z' })
  dateTo: string;
}
