import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import {
  IsInField,
  IsStringField,
  MaxLengthField,
  MinLengthField,
} from '@/shared/decorators/validators.js';
import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
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
    type: String,
    enum: COUNTRY_CODES,
    enumName: ENUM_NAMES.COUNTRY_CODE,
  })
  @IsOptional()
  @IsInField(COUNTRY_CODES)
  countryCode?: CountryCode;

  @ApiPropertyOptional({
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: ENUM_NAMES.CURRENCY_CODE,
  })
  @IsOptional()
  @IsInField(CURRENCY_CODES)
  baseCurrencyCode?: CurrencyCode;
}
