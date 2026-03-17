import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import {
  IsISO8601Field,
  IsNotEmptyField,
  IsStringField,
  IsUUIDField,
  MatchesField,
  MaxLengthField,
} from '@/shared/decorators/validators.js';

export class UpdateBudgetDto {
  @ApiPropertyOptional({ example: '750.00' })
  @IsOptional()
  @IsStringField()
  @IsNotEmptyField()
  @MatchesField(/^\d{1,17}(\.\d{1,2})?$/)
  amount?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;

  @ApiPropertyOptional({ example: '2026-06-30T23:59:59.999Z' })
  @IsOptional()
  @IsISO8601Field()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Updated grocery budget' })
  @IsOptional()
  @IsStringField()
  @MaxLengthField(500)
  description?: string;
}
