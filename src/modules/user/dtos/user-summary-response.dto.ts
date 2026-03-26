import { ApiProperty } from '@nestjs/swagger';

export class UserSummaryResponseDto {
  @ApiProperty({ description: 'Total number of registered users', example: 150 })
  total: number;

  @ApiProperty({ description: 'Number of users with the ADMIN role', example: 5 })
  adminCount: number;

  @ApiProperty({ description: 'Number of users registered today', example: 3 })
  newToday: number;
}
