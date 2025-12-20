import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener planes de precios
 */
export class GetPricingPlansRequest {
  @ApiProperty({
    description: 'Si se incluyen planes inactivos',
    example: false,
    required: false,
    default: false,
  })
  includeInactive?: boolean;
}
