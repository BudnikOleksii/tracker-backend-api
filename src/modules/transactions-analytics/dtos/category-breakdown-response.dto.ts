import { ApiProperty } from '@nestjs/swagger';

export class CategoryBreakdownItemDto {
  @ApiProperty({ description: 'Category ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  categoryId: string;

  @ApiProperty({ description: 'Category name', example: 'Groceries' })
  categoryName: string;

  @ApiProperty({ description: 'Category type', example: 'EXPENSE', enum: ['INCOME', 'EXPENSE'] })
  type: string;

  @ApiProperty({ description: 'Total amount for this category', example: '450.25' })
  total: string;

  @ApiProperty({ description: 'Number of transactions in this category', example: 12 })
  transactionCount: number;

  @ApiProperty({ description: 'Percentage of total', example: 14.07 })
  percentage: number;
}

export class CategoryBreakdownResponseDto {
  @ApiProperty({ description: 'Currency code', example: 'USD' })
  currencyCode: string;

  @ApiProperty({ description: 'Period start date', example: '2026-03-01T00:00:00.000Z' })
  dateFrom: string;

  @ApiProperty({ description: 'Period end date', example: '2026-03-31T23:59:59.999Z' })
  dateTo: string;

  @ApiProperty({ description: 'Category breakdown data', type: [CategoryBreakdownItemDto] })
  breakdown: CategoryBreakdownItemDto[];
}
