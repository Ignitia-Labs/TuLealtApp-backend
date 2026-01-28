import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para recalcular el uso de suscripción
 * Permite recalcular un partner específico o todos los partners activos
 */
export class RecalculateSubscriptionUsageRequest {
  @ApiProperty({
    description: 'ID del partner para recalcular su uso de suscripción. Si no se proporciona, se recalcularán todos los partners activos.',
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
    description: 'ID de la suscripción para recalcular su uso. Si se proporciona, se recalculará solo esta suscripción. Tiene prioridad sobre partnerId.',
    example: 1,
    type: Number,
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  partnerSubscriptionId?: number;
}
