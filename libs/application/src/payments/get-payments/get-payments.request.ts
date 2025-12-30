import { IsNumber, IsString, IsOptional, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener múltiples pagos
 */
export class GetPaymentsRequest {
  @ApiProperty({
    description: 'ID de la suscripción para filtrar los pagos',
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
    description: 'ID del partner para filtrar los pagos',
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
    description: 'ID de la factura para filtrar los pagos',
    example: 1,
    type: Number,
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  invoiceId?: number;

  @ApiProperty({
    description: 'Estado del pago para filtrar',
    example: 'paid',
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    required: false,
  })
  @IsEnum(['pending', 'paid', 'failed', 'refunded', 'cancelled'])
  @IsOptional()
  status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';

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

  @ApiProperty({
    description: 'Incluir payments derivados en los resultados (por defecto false, solo muestra payments originales)',
    example: false,
    type: Boolean,
    required: false,
  })
  @IsOptional()
  includeDerived?: boolean;
}

