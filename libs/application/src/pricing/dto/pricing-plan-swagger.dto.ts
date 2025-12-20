import { ApiProperty } from '@nestjs/swagger';
import { PricingFeatureSwaggerDto } from './pricing-feature-swagger.dto';
import { PricingPeriodSwaggerDto } from './pricing-period-swagger.dto';
import { PricingPromotionsSwaggerDto } from './pricing-promotions-swagger.dto';
import { PricingPromotionSwaggerDto } from './pricing-promotion-swagger.dto';

/**
 * DTO para documentación Swagger de PricingPlan
 * Representa la estructura completa de un plan de precios para Swagger
 */
export class PricingPlanSwaggerDto {
  @ApiProperty({ example: 1, description: 'ID del plan de precios' })
  id: number;

  @ApiProperty({ example: 'Esencia', description: 'Nombre del plan' })
  name: string;

  @ApiProperty({ example: '🟢', description: 'Icono del plan' })
  icon: string;

  @ApiProperty({
    example: 'esencia',
    description: 'Slug único del plan (debe ser único en la base de datos)',
  })
  slug: string;

  @ApiProperty({
    example: 19,
    nullable: true,
    description: 'Precio base legacy (deprecated)',
  })
  basePrice: number | null;

  @ApiProperty({ example: '/mes', description: 'Período legacy (deprecated)' })
  period: string;

  @ApiProperty({
    description: 'Estructura de precios por período',
    type: PricingPeriodSwaggerDto,
  })
  pricing: PricingPeriodSwaggerDto;

  @ApiProperty({
    description: 'Promociones por período de facturación',
    type: PricingPromotionsSwaggerDto,
    nullable: true,
    required: false,
  })
  promotions?: PricingPromotionsSwaggerDto | null;

  @ApiProperty({
    example: 'Para quienes recién comienzan a fidelizar',
    description: 'Descripción del plan',
  })
  description: string;

  @ApiProperty({
    description: 'Características del plan',
    type: PricingFeatureSwaggerDto,
    isArray: true,
  })
  features: PricingFeatureSwaggerDto[];

  @ApiProperty({ example: 'Comenzar Ahora', description: 'Texto del botón CTA' })
  cta: string;

  @ApiProperty({ example: false, description: 'Si el plan está destacado' })
  highlighted: boolean;

  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive'],
    description: 'Estado del plan',
  })
  status: 'active' | 'inactive';

  @ApiProperty({
    description: 'Promoción legacy (deprecated)',
    type: PricingPromotionSwaggerDto,
    nullable: true,
    required: false,
  })
  promotion?: PricingPromotionSwaggerDto | null;

  @ApiProperty({ example: 1, description: 'Orden de visualización' })
  order: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Fecha de creación',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-11-14T00:00:00.000Z',
    description: 'Fecha de última actualización',
  })
  updatedAt: Date;
}

