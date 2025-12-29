import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener ciclos de facturación
 */
export class GetBillingCyclesRequest {
  @ApiProperty({
    description: 'ID de la suscripción para filtrar los ciclos',
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
    description: 'ID del partner para filtrar los ciclos pendientes',
    example: 1,
    type: Number,
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  partnerId?: number;
}

