import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Request DTO para obtener todos los enrollments del usuario
 */
export class GetUserEnrollmentsRequest {
  @ApiProperty({
    description: 'Filtrar por status del enrollment',
    enum: ['ACTIVE', 'PAUSED', 'ENDED', 'all'],
    required: false,
    default: 'all',
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'PAUSED', 'ENDED', 'all'])
  status?: 'ACTIVE' | 'PAUSED' | 'ENDED' | 'all';
}
