import { ApiProperty } from '@nestjs/swagger';
import { PricingPromotionSwaggerDto } from '../dto/pricing-promotion-swagger.dto';

/**
 * DTO de response para calcular el precio de un plan
 */
export class CalculatePriceResponse {
  @ApiProperty({
    description: 'Precio base del período',
    example: 19,
    nullable: true,
    type: Number,
  })
  basePrice: number | null;

  @ApiProperty({
    description: 'Precio final con descuentos aplicados',
    example: 19,
    nullable: true,
    type: Number,
  })
  finalPrice: number | null;

  @ApiProperty({
    description: 'Precio equivalente mensual',
    example: 19,
    nullable: true,
    type: Number,
  })
  monthlyEquivalent: number | null;

  @ApiProperty({
    description: 'Precio formateado según la moneda',
    example: '$19',
    type: String,
  })
  formattedPrice: string;

  @ApiProperty({
    description: 'Información de la promoción aplicada',
    type: PricingPromotionSwaggerDto,
    nullable: true,
    required: false,
  })
  promotion?: PricingPromotionSwaggerDto;

  constructor(
    basePrice: number | null,
    finalPrice: number | null,
    monthlyEquivalent: number | null,
    formattedPrice: string,
    promotion?: PricingPromotionSwaggerDto,
  ) {
    this.basePrice = basePrice;
    this.finalPrice = finalPrice;
    this.monthlyEquivalent = monthlyEquivalent;
    this.formattedPrice = formattedPrice;
    this.promotion = promotion;
  }
}
