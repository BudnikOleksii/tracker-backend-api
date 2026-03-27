import { ApiProperty } from '@nestjs/swagger';

export class BudgetResponseDto {
  @ApiProperty({ description: 'Budget ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({
    description: 'Category ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
    type: String,
    nullable: true,
  })
  categoryId: string | null;

  @ApiProperty({ description: 'Budget amount', example: '500.00' })
  amount: string;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  currencyCode: string;

  @ApiProperty({
    description: 'Budget period',
    example: 'MONTHLY',
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'],
  })
  period: string;

  @ApiProperty({ description: 'Budget start date', example: '2026-03-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ description: 'Budget end date', example: '2026-03-31T23:59:59.999Z' })
  endDate: Date;

  @ApiProperty({ description: 'Budget status', example: 'ACTIVE', enum: ['ACTIVE', 'EXCEEDED'] })
  status: string;

  @ApiProperty({
    description: 'Budget description',
    example: 'Monthly grocery budget',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-03-01T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2026-03-01T10:30:00.000Z' })
  updatedAt: Date;
}
