import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

import { IsIntField, MaxField, MinField } from '@/shared/decorators/validators.js';

import { AnalyticsQueryDto } from './analytics-query.dto.js';

export class TopCategoriesQueryDto extends AnalyticsQueryDto {
  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsIntField()
  @MinField(1)
  @MaxField(20)
  limit?: number;
}
