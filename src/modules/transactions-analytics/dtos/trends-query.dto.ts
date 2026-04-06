import { ApiProperty } from '@nestjs/swagger';

import { IsInField } from '@/shared/decorators/validators.js';

import { AnalyticsQueryDto } from './analytics-query.dto.js';

export const GRANULARITY_VALUES = ['weekly', 'monthly'] as const;

export type Granularity = (typeof GRANULARITY_VALUES)[number];

export class TrendsQueryDto extends AnalyticsQueryDto {
  @ApiProperty({ example: 'monthly', enum: GRANULARITY_VALUES, enumName: 'Granularity' })
  @IsInField([...GRANULARITY_VALUES])
  granularity!: Granularity;
}
