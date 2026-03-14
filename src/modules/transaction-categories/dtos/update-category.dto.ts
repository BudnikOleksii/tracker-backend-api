import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import {
  IsNotEmptyField,
  IsStringField,
  IsUUIDField,
  MaxLengthField,
} from '@/shared/decorators/validators.js';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Groceries' })
  @IsOptional()
  @IsStringField()
  @IsNotEmptyField()
  @MaxLengthField(100)
  name?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  parentCategoryId?: string | null;
}
