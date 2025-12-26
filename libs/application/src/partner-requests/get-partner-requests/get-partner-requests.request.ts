import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO de request para obtener todas las solicitudes de partners
 */
export class GetPartnerRequestsRequest {
  @ApiProperty({
    description: 'Estado de las solicitudes a filtrar',
    example: 'pending',
    enum: ['pending', 'in-progress', 'enrolled', 'rejected'],
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: 'pending' | 'in-progress' | 'enrolled' | 'rejected';

  @ApiProperty({
    description: 'Número de registros a omitir (paginación)',
    example: 0,
    type: Number,
    required: false,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  skip?: number;

  @ApiProperty({
    description: 'Número máximo de registros a retornar (paginación)',
    example: 100,
    type: Number,
    required: false,
    default: 100,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  take?: number;
}
