import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

import {
  IsInField,
  IsStringField,
  MaxLengthField,
  MinLengthField,
} from '@/shared/decorators/validators.js';
import { COUNTRY_CODES } from '@/shared/enums/country-code.enum.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CountryCode } from '@/shared/enums/country-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsStringField()
  @MinLengthField(1)
  @MaxLengthField(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsStringField()
  @MinLengthField(1)
  @MaxLengthField(50)
  lastName?: string;

  @ApiPropertyOptional({
    example: 'US',
    enum: COUNTRY_CODES,
    enumName: 'CountryCode',
  })
  @IsOptional()
  @IsInField(COUNTRY_CODES)
  countryCode?: CountryCode;

  @ApiPropertyOptional({
    example: 'USD',
    enum: CURRENCY_CODES,
    enumName: 'CurrencyCode',
  })
  @IsOptional()
  @IsInField(CURRENCY_CODES)
  baseCurrencyCode?: CurrencyCode;

  @ApiPropertyOptional({ description: 'Whether the user has completed onboarding', example: true })
  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;
}
