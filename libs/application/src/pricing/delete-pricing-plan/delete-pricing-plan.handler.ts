import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IPricingPlanRepository } from '@libs/domain';
import { DeletePricingPlanRequest } from './delete-pricing-plan.request';
import { DeletePricingPlanResponse } from './delete-pricing-plan.response';

/**
 * Handler para el caso de uso de eliminar un plan de precios
 */
@Injectable()
export class DeletePricingPlanHandler {
  constructor(
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
  ) {}

  async execute(request: DeletePricingPlanRequest): Promise<DeletePricingPlanResponse> {
    // Verificar que el plan existe
    const existingPlan = await this.pricingPlanRepository.findById(request.planId);

    if (!existingPlan) {
      throw new NotFoundException(`Pricing plan with ID ${request.planId} not found`);
    }

    // Eliminar el plan
    await this.pricingPlanRepository.delete(request.planId);

    return new DeletePricingPlanResponse(request.planId);
  }
}

