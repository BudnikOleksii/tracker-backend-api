import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { IsISO8601Field, IsUUIDField } from '@/shared/decorators/validators.js';

export const EXPORT_FORMATS = ['json', 'csv'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export class ExportTransactionQueryDto {
  @ApiProperty({
    example: 'json',
    type: String,
    enum: EXPORT_FORMATS,
    enumName: 'ExportFormat',
    description: 'Output file format',
  })
  @IsIn(EXPORT_FORMATS)
  format!: ExportFormat;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000+02:00' })
  @IsOptional()
  @IsISO8601Field()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.999+02:00' })
  @IsOptional()
  @IsISO8601Field()
  dateTo?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUIDField()
  categoryId?: string;
}
