import { ApiProperty } from '@nestjs/swagger';

export class RevokeTokenResponseDto {
  @ApiProperty({ description: 'Whether the token was successfully revoked', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable result message',
    example: 'Refresh token revoked',
  })
  message: string;
}
