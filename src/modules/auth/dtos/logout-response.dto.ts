import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Human-readable result message',
    example: 'Logged out successfully',
  })
  message: string;
}
