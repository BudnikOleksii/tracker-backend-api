import { ApiProperty } from '@nestjs/swagger';

export class ImportTransactionResponseDto {
  @ApiProperty({ description: 'Number of transactions created', example: 42 })
  transactionsCreated: number;

  @ApiProperty({ description: 'Number of new parent categories created', example: 3 })
  categoriesCreated: number;

  @ApiProperty({ description: 'Number of new subcategories created', example: 5 })
  subcategoriesCreated: number;

  @ApiProperty({ description: 'Number of rows that failed to import', example: 0 })
  failedCount: number;

  @ApiProperty({
    description: 'Row-level error descriptions',
    example: ['Row 5: Invalid date format "13/32/2026 00:00:00"'],
    type: [String],
  })
  errors: string[];
}
