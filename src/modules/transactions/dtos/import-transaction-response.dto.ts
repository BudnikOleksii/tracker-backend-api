import { ApiProperty } from '@nestjs/swagger';

export class ImportTransactionResponseDto {
  @ApiProperty({ description: 'Number of transactions created', example: 42 })
  transactionsCreated: number;

  @ApiProperty({ description: 'Number of new parent categories created', example: 3 })
  categoriesCreated: number;

  @ApiProperty({ description: 'Number of new subcategories created', example: 5 })
  subcategoriesCreated: number;
}
