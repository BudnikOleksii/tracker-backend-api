import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { AnalyticsQueryDto } from './analytics-query.dto.js';

export class TopCategoriesQueryDto extends AnalyticsQueryDto {
  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(20)
  limit?: number;
}
