import { ApiProperty } from '@nestjs/swagger';

export class DailySpendingItemDto {
  @ApiProperty({ description: 'Date', example: '2026-03-15' })
  date: string;

  @ApiProperty({ description: 'Total amount for this day', example: '45.99' })
  total: string;

  @ApiProperty({ description: 'Number of transactions on this day', example: 3 })
  transactionCount: number;
}

export class DailySpendingResponseDto {
  @ApiProperty({ description: 'Currency code', example: 'USD' })
  currencyCode: string;

  @ApiProperty({ description: 'Year', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Month (1-12)', example: 3 })
  month: number;

  @ApiProperty({ description: 'Daily spending data', type: [DailySpendingItemDto] })
  days: DailySpendingItemDto[];
}
