import { ApiProperty } from '@nestjs/swagger';

export interface BulkDeleteFailure {
  id: string;
  reason: string;
}

export interface BulkDeleteResult {
  deleted: number;
  failed: BulkDeleteFailure[];
  message: string;
}

export class BulkDeleteFailureDto {
  @ApiProperty({ description: 'ID of the record that failed to delete' })
  id: string;

  @ApiProperty({ description: 'Reason the record could not be deleted', example: 'Not found' })
  reason: string;
}

export class BulkDeleteResponseDto {
  @ApiProperty({ description: 'Number of records successfully deleted', example: 3 })
  deleted: number;

  @ApiProperty({
    description: 'Records that could not be deleted with reasons',
    type: [BulkDeleteFailureDto],
  })
  failed: BulkDeleteFailureDto[];

  @ApiProperty({ description: 'Summary message', example: '3 transactions deleted successfully' })
  message: string;
}
