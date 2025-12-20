import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { GetPricingPlanByIdRequest } from './get-pricing-plan-by-id.request';
import { GetPricingPlanByIdResponse } from './get-pricing-plan-by-id.response';
import { IPricingPlanRepository } from '@libs/domain';

/**
 * Handler para el caso de uso de obtener un plan de precios por ID
 */
@Injectable()
export class GetPricingPlanByIdHandler {
  constructor(
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
  ) {}

  async execute(request: GetPricingPlanByIdRequest): Promise<GetPricingPlanByIdResponse> {
    const plan = await this.pricingPlanRepository.findById(request.planId);

    if (!plan) {
      throw new NotFoundException(`Pricing plan with ID ${request.planId} not found`);
    }

    return new GetPricingPlanByIdResponse(plan);
  }
}

