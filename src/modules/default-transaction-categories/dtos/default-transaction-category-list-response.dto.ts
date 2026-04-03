import { ApiProperty } from '@nestjs/swagger';

import { OffsetListResponseDto } from '@/shared/dtos/list-response.dto.js';

import { DefaultTransactionCategoryResponseDto } from './default-transaction-category-response.dto.js';

export class DefaultTransactionCategoryListResponseDto extends OffsetListResponseDto<DefaultTransactionCategoryResponseDto> {
  @ApiProperty({
    description: 'List of default transaction categories',
    type: [DefaultTransactionCategoryResponseDto],
  })
  declare data: DefaultTransactionCategoryResponseDto[];
}
