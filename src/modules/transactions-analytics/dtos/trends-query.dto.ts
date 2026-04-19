import { ApiProperty } from '@nestjs/swagger';

import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
import { IsInField } from '@/shared/decorators/validators.js';

import { AnalyticsQueryDto } from './analytics-query.dto.js';

export const GRANULARITY_VALUES = ['weekly', 'monthly'] as const;

export type Granularity = (typeof GRANULARITY_VALUES)[number];

export class TrendsQueryDto extends AnalyticsQueryDto {
  @ApiProperty({ example: 'monthly', enum: GRANULARITY_VALUES, enumName: ENUM_NAMES.GRANULARITY })
  @IsInField([...GRANULARITY_VALUES])
  granularity!: Granularity;
}
