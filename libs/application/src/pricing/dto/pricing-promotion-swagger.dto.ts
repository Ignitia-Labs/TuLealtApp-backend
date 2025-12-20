import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para documentación Swagger de PricingPromotion
 */
export class PricingPromotionSwaggerDto {
  @ApiProperty({ example: true, description: 'Si la promoción está activa' })
  active: boolean;

  @ApiProperty({ example: 5, description: 'Porcentaje de descuento' })
  discountPercent: number;

  @ApiProperty({
    example: '5% OFF - Ahorra pagando trimestral',
    description: 'Etiqueta de la promoción',
  })
  label: string;

  @ApiProperty({
    example: '2025-12-31T23:59:59Z',
    required: false,
    description: 'Fecha de validez de la promoción (ISO string)',
  })
  validUntil?: string;
}

