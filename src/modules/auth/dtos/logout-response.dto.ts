import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({ description: 'Whether the logout was successful', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable result message',
    example: 'Logged out successfully',
  })
  message: string;
}
