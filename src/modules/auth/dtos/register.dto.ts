import { ApiProperty } from '@nestjs/swagger';

import {
  IsEmailField,
  IsNotEmptyField,
  IsStringField,
  MatchesField,
  MaxLengthField,
  MinLengthField,
} from '@/shared/decorators/validators.js';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmailField({ message: 'Invalid email format' })
  email!: string;

  @ApiProperty({ example: 'Pass123456' })
  @IsStringField()
  @IsNotEmptyField({ message: 'Password must not be empty' })
  @MinLengthField(8, { message: 'Password must be at least 8 characters long' })
  @MaxLengthField(100, { message: 'Password must not exceed 100 characters' })
  @MatchesField(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Password must contain at least one letter and one digit',
  })
  password!: string;
}
