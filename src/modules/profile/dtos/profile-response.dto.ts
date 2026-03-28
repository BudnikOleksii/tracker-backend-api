import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'First name', example: 'John', nullable: true })
  firstName: string | null;

  @ApiProperty({ description: 'Last name', example: 'Doe', nullable: true })
  lastName: string | null;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
    enum: COUNTRY_CODES,
    enumName: 'CountryCode',
    nullable: true,
  })
  countryCode: CountryCode | null;

  @ApiProperty({
    description: 'Base currency code (ISO 4217)',
    example: 'USD',
    enum: CURRENCY_CODES,
    enumName: 'CurrencyCode',
    nullable: true,
  })
  baseCurrencyCode: CurrencyCode | null;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
    enum: ROLES,
    enumName: 'UserRole',
  })
  role: UserRole;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-03-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2026-03-15T10:30:00.000Z' })
  updatedAt: Date;
}
