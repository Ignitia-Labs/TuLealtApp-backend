import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { GetPricingPlanBySlugRequest } from './get-pricing-plan-by-slug.request';
import { GetPricingPlanBySlugResponse } from './get-pricing-plan-by-slug.response';
import { IPricingPlanRepository } from '@libs/domain';

/**
 * Handler para el caso de uso de obtener un plan de precios por slug
 */
@Injectable()
export class GetPricingPlanBySlugHandler {
  constructor(
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
  ) {}

  async execute(request: GetPricingPlanBySlugRequest): Promise<GetPricingPlanBySlugResponse> {
    const plan = await this.pricingPlanRepository.findBySlug(request.slug);

    if (!plan) {
      throw new NotFoundException(`Pricing plan with slug ${request.slug} not found`);
    }

    return new GetPricingPlanBySlugResponse(plan);
  }
}
