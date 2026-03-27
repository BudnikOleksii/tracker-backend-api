import { ApiProperty } from '@nestjs/swagger';

export class ProcessResultResponseDto {
  @ApiProperty({ description: 'Number of recurring transactions processed', example: 5 })
  processedCount: number;

  @ApiProperty({ description: 'Number of transactions created', example: 5 })
  transactionsCreated: number;
}
