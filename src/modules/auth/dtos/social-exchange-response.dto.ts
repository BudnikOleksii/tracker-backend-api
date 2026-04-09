import { ApiProperty } from '@nestjs/swagger';

import { AuthResponseDto } from './login.dto.js';

export class SocialExchangeResponseDto extends AuthResponseDto {
  @ApiProperty({ description: 'Whether this is a newly registered user', example: false })
  isNewUser: boolean;
}
