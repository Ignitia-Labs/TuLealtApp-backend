import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener múltiples facturas
 */
export class GetInvoicesRequest {
  @ApiProperty({
    description: 'ID de la suscripción para filtrar las facturas',
    example: 1,
    type: Number,
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  subscriptionId?: number;

  @ApiProperty({
    description: 'ID del partner para filtrar las facturas',
    example: 1,
    type: Number,
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  partnerId?: number;

  @ApiProperty({
    description: 'Número de página para paginación',
    example: 1,
    type: Number,
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Cantidad de elementos por página',
    example: 10,
    type: Number,
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;
}

