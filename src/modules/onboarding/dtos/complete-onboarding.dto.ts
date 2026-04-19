import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import {
  IsInField,
  IsNotEmptyField,
  IsStringField,
  MatchesField,
  MaxLengthField,
  MinLengthField,
} from '@/shared/decorators/validators.js';
import { CURRENCY_CODES, type CurrencyCode } from '@/shared/enums/currency-code.enum.js';

export class CompleteOnboardingDto {
  @ApiProperty({ example: 'USD', type: String, enum: CURRENCY_CODES, enumName: 'CurrencyCode' })
  @IsStringField()
  @IsNotEmptyField({ message: 'baseCurrencyCode is required' })
  @IsInField([...CURRENCY_CODES], { message: 'Invalid currency code' })
  baseCurrencyCode!: CurrencyCode;

  @ApiPropertyOptional({ example: 'Pass123456' })
  @IsOptional()
  @IsStringField()
  @MinLengthField(8, { message: 'Password must be at least 8 characters long' })
  @MaxLengthField(100, { message: 'Password must not exceed 100 characters' })
  @MatchesField(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Password must contain at least one letter and one digit',
  })
  password?: string;
}
