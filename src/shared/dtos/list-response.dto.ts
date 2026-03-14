import { ApiProperty } from '@nestjs/swagger'

export class ListResponseDto<T> {
  @ApiProperty({ example: 'list', enum: ['list'] })
  readonly object = 'list' as const

  @ApiProperty({ isArray: true })
  data: T[]
}

export class OffsetListResponseDto<T> extends ListResponseDto<T> {
  @ApiProperty({ example: 1 })
  page: number

  @ApiProperty({ example: 20 })
  pageSize: number

  @ApiProperty({ example: 100 })
  total: number

  @ApiProperty({ example: true })
  hasMore: boolean
}
