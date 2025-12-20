import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IPricingPlanRepository } from '@libs/domain';
import { ToggleStatusPricingPlanRequest } from './toggle-status-pricing-plan.request';
import { ToggleStatusPricingPlanResponse } from './toggle-status-pricing-plan.response';

/**
 * Handler para el caso de uso de activar/desactivar un plan de precios
 */
@Injectable()
export class ToggleStatusPricingPlanHandler {
  constructor(
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
  ) {}

  async execute(request: ToggleStatusPricingPlanRequest): Promise<ToggleStatusPricingPlanResponse> {
    // Buscar el plan existente
    const existingPlan = await this.pricingPlanRepository.findById(request.planId);

    if (!existingPlan) {
      throw new NotFoundException(`Pricing plan with ID ${request.planId} not found`);
    }

    // Toggle del estado: si está activo, desactivarlo; si está inactivo, activarlo
    const updatedPlan = existingPlan.isActive() ? existingPlan.deactivate() : existingPlan.activate();

    // Guardar los cambios
    const savedPlan = await this.pricingPlanRepository.update(updatedPlan);

    return new ToggleStatusPricingPlanResponse(savedPlan);
  }
}

