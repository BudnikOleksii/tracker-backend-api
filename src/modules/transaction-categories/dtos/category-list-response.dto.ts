import { ApiProperty } from '@nestjs/swagger';

import { OffsetListResponseDto } from '@/shared/dtos/list-response.dto.js';

import { CategoryResponseDto } from './category-response.dto.js';

export class CategoryListResponseDto extends OffsetListResponseDto<CategoryResponseDto> {
  @ApiProperty({ description: 'List of categories', type: [CategoryResponseDto] })
  declare data: CategoryResponseDto[];
}
