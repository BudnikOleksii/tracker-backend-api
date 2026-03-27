import { ApiProperty } from '@nestjs/swagger';

export class TopCategoryItemDto {
  @ApiProperty({ description: 'Category rank', example: 1 })
  rank: number;

  @ApiProperty({ description: 'Category ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  categoryId: string;

  @ApiProperty({ description: 'Category name', example: 'Groceries' })
  categoryName: string;

  @ApiProperty({ description: 'Total amount', example: '450.25' })
  total: string;

  @ApiProperty({ description: 'Percentage of total', example: 28.5 })
  percentage: number;

  @ApiProperty({ description: 'Number of transactions', example: 12 })
  transactionCount: number;
}

export class TopCategoriesResponseDto {
  @ApiProperty({ description: 'Currency code', example: 'USD' })
  currencyCode: string;

  @ApiProperty({ description: 'Top categories data', type: [TopCategoryItemDto] })
  categories: TopCategoryItemDto[];
}
