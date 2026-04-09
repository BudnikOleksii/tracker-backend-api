import { ApiProperty } from '@nestjs/swagger';

export class OnboardingStatusResponseDto {
  @ApiProperty()
  onboardingCompleted!: boolean;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty()
  hasBaseCurrency!: boolean;

  @ApiProperty()
  hasCategories!: boolean;

  @ApiProperty()
  hasPassword!: boolean;
}
