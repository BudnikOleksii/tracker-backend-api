import { ApiProperty } from '@nestjs/swagger';

import { OffsetListResponseDto } from '@/shared/dtos/list-response.dto.js';

import { UserResponseDto } from './user-response.dto.js';

export class UserListResponseDto extends OffsetListResponseDto<UserResponseDto> {
  @ApiProperty({ description: 'List of users', type: [UserResponseDto] })
  declare data: UserResponseDto[];
}
