import { Injectable, Inject } from '@nestjs/common';
import { GetPricingPlansRequest } from './get-pricing-plans.request';
import { GetPricingPlansResponse } from './get-pricing-plans.response';
import { IPricingPlanRepository } from '@libs/domain';

/**
 * Handler para el caso de uso de obtener planes de precios
 */
@Injectable()
export class GetPricingPlansHandler {
  constructor(
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
  ) {}

  async execute(request: GetPricingPlansRequest): Promise<GetPricingPlansResponse> {
    const plans = await this.pricingPlanRepository.findAll(request.includeInactive || false);

    return new GetPricingPlansResponse(plans);
  }
}
