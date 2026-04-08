import { ApiProperty } from '@nestjs/swagger';

export class RevokeTokenResponseDto {
  @ApiProperty({
    description: 'Human-readable result message',
    example: 'Refresh token revoked',
  })
  message: string;
}
