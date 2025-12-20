import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CalculatePriceRequest } from './calculate-price.request';
import { CalculatePriceResponse } from './calculate-price.response';
import { IPricingPlanRepository } from '@libs/domain';
import {
  getPriceForPeriod,
  getPromotionForPeriod,
  calculateFinalPrice,
  calculateMonthlyEquivalent,
  formatPrice,
} from '@libs/shared';
import { PricingPromotionSwaggerDto } from '../dto/pricing-promotion-swagger.dto';

/**
 * Handler para el caso de uso de calcular el precio de un plan
 */
@Injectable()
export class CalculatePriceHandler {
  constructor(
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
  ) {}

  async execute(request: CalculatePriceRequest): Promise<CalculatePriceResponse> {
    const plan = await this.pricingPlanRepository.findById(request.planId);

    if (!plan) {
      throw new NotFoundException(`Pricing plan with ID ${request.planId} not found`);
    }

    const basePrice = getPriceForPeriod(plan, request.period);
    const promotionData = getPromotionForPeriod(plan, request.period);
    const finalPrice = calculateFinalPrice(plan, request.period);
    const monthlyEquivalent = calculateMonthlyEquivalent(plan, request.period);
    const formattedPrice = formatPrice(basePrice, request.currency || 'USD', promotionData);

    // Convertir promotion a DTO si existe
    const promotionDto: PricingPromotionSwaggerDto | undefined = promotionData
      ? {
          active: promotionData.active,
          discountPercent: promotionData.discountPercent,
          label: promotionData.label,
          validUntil: promotionData.validUntil,
        }
      : undefined;

    return new CalculatePriceResponse(
      basePrice,
      finalPrice,
      monthlyEquivalent,
      formattedPrice,
      promotionDto,
    );
  }
}
