import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Category name', example: 'Groceries' })
  name: string;

  @ApiProperty({ description: 'Category type', example: 'EXPENSE', enum: ['INCOME', 'EXPENSE'] })
  type: string;

  @ApiProperty({
    description: 'Parent category ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    type: String,
    nullable: true,
  })
  parentCategoryId: string | null;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-03-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2026-03-15T10:30:00.000Z' })
  updatedAt: Date;
}
