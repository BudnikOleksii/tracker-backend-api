import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsUUID } from 'class-validator';

export class BulkDeleteDto {
  @ApiProperty({
    description: 'Array of UUIDs to delete',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
    minItems: 1,
    maxItems: 100,
  })
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  ids: string[];
}
