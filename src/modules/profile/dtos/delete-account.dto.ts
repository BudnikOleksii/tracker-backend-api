import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeleteAccountDto {
  @ApiPropertyOptional({
    example: 'Pass123456',
    description: 'Required for email/password accounts, optional for social-only accounts',
  })
  @IsOptional()
  @IsString()
  password?: string;
}
