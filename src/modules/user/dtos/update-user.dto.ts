import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { IsStringField } from '@/shared/decorators/validators.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'USER', enum: ['USER', 'ADMIN', 'SUPER_ADMIN'] })
  @IsOptional()
  @IsStringField()
  @IsIn(['USER', 'ADMIN', 'SUPER_ADMIN'])
  role?: string;
}
