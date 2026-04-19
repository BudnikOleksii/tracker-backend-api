import { ApiProperty } from '@nestjs/swagger';

import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';

class TopCategoryItemDto {
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
  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: ENUM_NAMES.CURRENCY_CODE,
  })
  currencyCode: CurrencyCode;

  @ApiProperty({
    description: 'Top categories data',
    type: [TopCategoryItemDto],
    example: [
      {
        rank: 1,
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        categoryName: 'Groceries',
        total: '450.25',
        percentage: 28.5,
        transactionCount: 12,
      },
    ],
  })
  categories: TopCategoryItemDto[];
}
