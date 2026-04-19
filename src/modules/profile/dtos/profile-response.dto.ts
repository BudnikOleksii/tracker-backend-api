import { ApiProperty } from '@nestjs/swagger';

import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
import { COUNTRY_CODES } from '@/shared/enums/country-code.enum.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import { ROLES } from '@/shared/enums/role.enum.js';
import type { CountryCode } from '@/shared/enums/country-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

export class ProfileResponseDto {
  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'First name', example: 'John', type: String, nullable: true })
  firstName: string | null;

  @ApiProperty({ description: 'Last name', example: 'Doe', type: String, nullable: true })
  lastName: string | null;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
    type: String,
    enum: COUNTRY_CODES,
    enumName: ENUM_NAMES.COUNTRY_CODE,
    nullable: true,
  })
  countryCode: CountryCode | null;

  @ApiProperty({
    description: 'Base currency code (ISO 4217)',
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: ENUM_NAMES.CURRENCY_CODE,
    nullable: true,
  })
  baseCurrencyCode: CurrencyCode | null;

  @ApiProperty({ description: 'Whether the user has completed onboarding', example: false })
  onboardingCompleted: boolean;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
    type: String,
    enum: ROLES,
    enumName: ENUM_NAMES.USER_ROLE,
  })
  role: UserRole;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-03-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2026-03-15T10:30:00.000Z' })
  updatedAt: Date;
}
