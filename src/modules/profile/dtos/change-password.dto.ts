import { ApiProperty } from '@nestjs/swagger';

import {
  IsNotEmptyField,
  IsStringField,
  MatchesField,
  MaxLengthField,
  MinLengthField,
} from '@/shared/decorators/validators.js';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass123' })
  @IsStringField()
  @IsNotEmptyField({ message: 'Current password must not be empty' })
  currentPassword: string;

  @ApiProperty({ example: 'NewPass456' })
  @IsStringField()
  @IsNotEmptyField({ message: 'New password must not be empty' })
  @MinLengthField(8, { message: 'Password must be at least 8 characters long' })
  @MaxLengthField(100, { message: 'Password must not exceed 100 characters' })
  @MatchesField(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Password must contain at least one letter and one digit',
  })
  newPassword: string;
}
