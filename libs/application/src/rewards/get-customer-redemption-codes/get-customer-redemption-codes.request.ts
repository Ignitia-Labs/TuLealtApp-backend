import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO de request para obtener códigos de canje de un cliente
 */
export class GetCustomerRedemptionCodesRequest {
  @ApiProperty({
    description: 'ID de la membership del cliente',
    example: 1,
    type: Number,
  })
  membershipId: number;

  @ApiProperty({
    description: 'Filtrar por estado del código',
    example: 'pending',
    enum: ['pending', 'used', 'expired', 'cancelled'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['pending', 'used', 'expired', 'cancelled'])
  status?: 'pending' | 'used' | 'expired' | 'cancelled';

  @ApiProperty({
    description: 'Número de página (paginación)',
    example: 1,
    type: Number,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Límite de resultados por página',
    example: 20,
    type: Number,
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
