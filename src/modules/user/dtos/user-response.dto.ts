import { ApiProperty } from '@nestjs/swagger';

import type { AuthProvider } from '@/shared/enums/auth-provider.enum.js';
import { AUTH_PROVIDERS } from '@/shared/enums/auth-provider.enum.js';
import type { CountryCode } from '@/shared/enums/country-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';
import { ROLES } from '@/shared/enums/role.enum.js';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
    enum: ROLES,
    enumName: 'UserRole',
  })
  role: UserRole;

  @ApiProperty({
    description: 'Authentication provider',
    example: 'LOCAL',
    enum: AUTH_PROVIDERS,
    enumName: 'AuthProvider',
  })
  authProvider: AuthProvider;

  @ApiProperty({ description: 'Whether user email is verified', example: true })
  emailVerified: boolean;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-3)',
    example: 'USA',
    nullable: true,
  })
  countryCode: CountryCode | null;

  @ApiProperty({ description: 'Base currency code (ISO 4217)', example: 'USD', nullable: true })
  baseCurrencyCode: CurrencyCode | null;

  @ApiProperty({ description: 'Whether onboarding is completed', example: false })
  onboardingCompleted: boolean;

  @ApiProperty({ description: 'Last known IP address', example: '192.168.1.1', nullable: true })
  ipAddress: string | null;

  @ApiProperty({
    description: 'Last known user agent',
    example: 'Mozilla/5.0...',
    nullable: true,
  })
  userAgent: string | null;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-03-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2026-03-15T10:30:00.000Z' })
  updatedAt: Date;
}
