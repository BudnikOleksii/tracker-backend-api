import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class FieldError {
  @ApiPropertyOptional({ example: 'email' })
  field?: string

  @ApiPropertyOptional({ example: '/email' })
  pointer?: string

  @ApiProperty({ example: 'INVALID_EMAIL' })
  code: string

  @ApiProperty({ example: 'email must be a valid email address' })
  message: string
}

export class ProblemDetailsDto {
  @ApiProperty({ example: 'https://api.example.com/errors/validation-failed' })
  type: string

  @ApiProperty({ example: 'Unprocessable Entity' })
  title: string

  @ApiProperty({ example: 422 })
  status: number

  @ApiPropertyOptional({ example: '/api/users' })
  instance?: string

  @ApiPropertyOptional({ example: 'req_xyz789' })
  request_id?: string

  @ApiPropertyOptional({ example: '2024-11-03T10:30:00Z' })
  timestamp?: string

  @ApiPropertyOptional({ example: 'INVALID_CREDENTIALS' })
  code?: string

  @ApiPropertyOptional({ example: 'Invalid email or password' })
  detail?: string

  @ApiPropertyOptional({ type: [FieldError] })
  errors?: FieldError[]
}
