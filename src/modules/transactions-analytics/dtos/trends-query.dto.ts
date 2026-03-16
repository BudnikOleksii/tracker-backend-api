import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { AnalyticsQueryDto } from './analytics-query.dto.js';

export const GRANULARITY_VALUES = ['weekly', 'monthly'] as const;

export type Granularity = (typeof GRANULARITY_VALUES)[number];

export class TrendsQueryDto extends AnalyticsQueryDto {
  @ApiProperty({ example: 'monthly', enum: GRANULARITY_VALUES })
  @IsIn(GRANULARITY_VALUES)
  granularity!: Granularity;
}
