import { ApiProperty } from '@nestjs/swagger';
import { PricingPromotionSwaggerDto } from './pricing-promotion-swagger.dto';

/**
 * DTO para documentación Swagger de BillingPeriodPromotions
 */
export class PricingPromotionsSwaggerDto {
  @ApiProperty({
    type: PricingPromotionSwaggerDto,
    required: false,
    description: 'Promoción para período mensual',
  })
  monthly?: PricingPromotionSwaggerDto;

  @ApiProperty({
    type: PricingPromotionSwaggerDto,
    required: false,
    description: 'Promoción para período trimestral',
  })
  quarterly?: PricingPromotionSwaggerDto;

  @ApiProperty({
    type: PricingPromotionSwaggerDto,
    required: false,
    description: 'Promoción para período semestral',
  })
  semiannual?: PricingPromotionSwaggerDto;

  @ApiProperty({
    type: PricingPromotionSwaggerDto,
    required: false,
    description: 'Promoción para período anual',
  })
  annual?: PricingPromotionSwaggerDto;
}
