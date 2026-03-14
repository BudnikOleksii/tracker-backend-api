import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import {
  IsBooleanField,
  IsStringField,
  MaxLengthField,
  MinLengthField,
} from '@/shared/decorators/validators.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsStringField()
  @MinLengthField(1)
  @MaxLengthField(50)
  name?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBooleanField()
  banned?: boolean;

  @ApiPropertyOptional({ example: 'Violated terms of service' })
  @IsOptional()
  @IsStringField()
  @MaxLengthField(500)
  banReason?: string;
}
