import { ApiProperty } from '@nestjs/swagger';

export class ParentCategoryInfoDto {
  @ApiProperty({
    description: 'Parent category ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;

  @ApiProperty({ description: 'Parent category name', example: 'Groceries' })
  name: string;
}

export class CategoryInfoDto {
  @ApiProperty({ description: 'Category ID', example: '550e8400-e29b-41d4-a716-446655440002' })
  id: string;

  @ApiProperty({ description: 'Category name', example: 'Vegetables' })
  name: string;

  @ApiProperty({
    description: 'Parent category details, null if this is a top-level category',
    type: ParentCategoryInfoDto,
    nullable: true,
    example: { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Groceries' },
  })
  parentCategory: ParentCategoryInfoDto | null;
}
