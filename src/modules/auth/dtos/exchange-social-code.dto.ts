import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ExchangeSocialCodeDto {
  @ApiProperty({ description: 'Authorization code from social auth redirect' })
  @IsNotEmpty()
  @IsUUID()
  code!: string;
}
