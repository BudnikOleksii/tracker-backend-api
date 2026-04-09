import { ApiProperty } from '@nestjs/swagger';

export class ListResponseDto<T> {
  @ApiProperty({ description: 'Object type', example: 'list', enum: ['list'] })
  readonly object = 'list' as const;

  @ApiProperty({ description: 'List of items', isArray: true })
  data: T[];
}

export class OffsetListResponseDto<T> extends ListResponseDto<T> {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 20 })
  pageSize: number;

  @ApiProperty({ description: 'Total number of matching records', example: 100 })
  total: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Whether more pages are available', example: true })
  hasMore: boolean;
}
