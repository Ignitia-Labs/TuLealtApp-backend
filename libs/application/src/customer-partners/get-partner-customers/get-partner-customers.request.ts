import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, IsOptional, IsString, IsIn } from 'class-validator';

/**
 * DTO de request para obtener los customers de un partner (con paginación)
 */
export class GetPartnerCustomersRequest {
  @ApiProperty({
    description: 'ID del partner',
    example: 5,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  partnerId: number;

  @ApiProperty({
    description: 'Número de página (por defecto 1)',
    example: 1,
    type: Number,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Límite de resultados por página (por defecto 50)',
    example: 50,
    type: Number,
    minimum: 1,
    maximum: 100,
    required: false,
    default: 50,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @ApiProperty({
    description: 'Filtrar por status (opcional)',
    example: 'active',
    enum: ['active', 'inactive', 'suspended'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: string;
}
