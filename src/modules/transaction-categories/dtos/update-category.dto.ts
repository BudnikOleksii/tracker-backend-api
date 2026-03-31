import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsStringField()
  @IsNotEmptyField()
  @MaxLengthField(100)
  name?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsUUIDField()
  parentCategoryId?: string | null;
}
