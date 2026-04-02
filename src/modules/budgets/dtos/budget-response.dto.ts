import { ApiProperty } from '@nestjs/swagger';

import type { BudgetPeriod, BudgetStatus } from '@/shared/enums/budget.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import { BUDGET_PERIODS, BUDGET_STATUSES } from '@/shared/enums/budget.enum.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';

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

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: 'CurrencyCode',
  })
  currencyCode: CurrencyCode;

  @ApiProperty({
    description: 'Budget period',
    example: 'MONTHLY',
    type: String,
    enum: BUDGET_PERIODS,
    enumName: 'BudgetPeriod',
  })
  period: BudgetPeriod;

  @ApiProperty({ description: 'Budget start date', example: '2026-03-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ description: 'Budget end date', example: '2026-03-31T23:59:59.999Z' })
  endDate: Date;

  @ApiProperty({
    description: 'Budget status',
    example: 'ACTIVE',
    type: String,
    enum: BUDGET_STATUSES,
    enumName: 'BudgetStatus',
  })
  status: BudgetStatus;

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
