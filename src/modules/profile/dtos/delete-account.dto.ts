import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmptyField, IsStringField } from '@/shared/decorators/validators.js';

export class DeleteAccountDto {
  @ApiProperty({ example: 'Pass123456' })
  @IsStringField()
  @IsNotEmptyField({ message: 'Password must not be empty' })
  password: string;
}
