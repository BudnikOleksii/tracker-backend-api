import { ApiProperty } from '@nestjs/swagger';

import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';

import { TransactionResponseDto } from './transaction-response.dto.js';

export class SubcategoryTotalDto {
  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    type: String,
    enum: CURRENCY_CODES,
    enumName: ENUM_NAMES.CURRENCY_CODE,
  })
  currencyCode: CurrencyCode;

  @ApiProperty({ description: 'Total amount for this currency', example: '149.97' })
  total: string;
}

export class SubcategoryInfoDto {
  @ApiProperty({ description: 'Subcategory ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ description: 'Subcategory name', example: 'Groceries' })
  name: string;
}

export class TransactionGroupDto {
  @ApiProperty({
    description: 'Subcategory info, or null for transactions directly under the parent category',
    type: SubcategoryInfoDto,
    nullable: true,
  })
  subcategory: SubcategoryInfoDto | null;

  @ApiProperty({ description: 'Transactions in this group', type: [TransactionResponseDto] })
  transactions: TransactionResponseDto[];

  @ApiProperty({ description: 'Totals per currency for this group', type: [SubcategoryTotalDto] })
  totals: SubcategoryTotalDto[];
}

export class TransactionsByCategoryResponseDto {
  @ApiProperty({ description: 'Transaction groups by subcategory', type: [TransactionGroupDto] })
  groups: TransactionGroupDto[];

  @ApiProperty({
    description: 'Whether the result set was truncated due to exceeding the maximum row limit',
    example: false,
  })
  isTruncated: boolean;
}
