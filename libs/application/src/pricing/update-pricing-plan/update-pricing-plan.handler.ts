import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { IPricingPlanRepository, PricingPlan } from '@libs/domain';
import { UpdatePricingPlanRequest } from './update-pricing-plan.request';
import { UpdatePricingPlanResponse } from './update-pricing-plan.response';

/**
 * Handler para el caso de uso de actualizar un plan de precios
 */
@Injectable()
export class UpdatePricingPlanHandler {
  constructor(
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
  ) {}

  async execute(request: UpdatePricingPlanRequest): Promise<UpdatePricingPlanResponse> {
    // Buscar el plan existente
    const existingPlan = await this.pricingPlanRepository.findById(request.planId);

    if (!existingPlan) {
      throw new NotFoundException(`Pricing plan with ID ${request.planId} not found`);
    }

    // Validar que el slug no esté en uso por otro plan (si se está actualizando)
    if (request.slug && request.slug !== existingPlan.slug) {
      const planWithSlug = await this.pricingPlanRepository.findBySlug(request.slug);
      if (planWithSlug) {
        throw new BadRequestException(`Pricing plan with slug ${request.slug} already exists`);
      }
    }

    // Crear nuevo plan con los valores actualizados
    const updatedPlan = new PricingPlan(
      existingPlan.id,
      request.name ?? existingPlan.name,
      request.icon ?? existingPlan.icon,
      request.slug ?? existingPlan.slug,
      request.basePrice !== undefined ? request.basePrice : existingPlan.basePrice,
      request.period !== undefined ? request.period : existingPlan.period,
      request.pricing
        ? {
            monthly: request.pricing.monthly ?? existingPlan.pricing.monthly,
            quarterly: request.pricing.quarterly ?? existingPlan.pricing.quarterly,
            semiannual: request.pricing.semiannual ?? existingPlan.pricing.semiannual,
            annual: request.pricing.annual ?? existingPlan.pricing.annual,
          }
        : existingPlan.pricing,
      request.promotions !== undefined
        ? request.promotions
          ? {
              monthly: request.promotions.monthly,
              quarterly: request.promotions.quarterly,
              semiannual: request.promotions.semiannual,
              annual: request.promotions.annual,
            }
          : null
        : existingPlan.promotions,
      request.description ?? existingPlan.description,
      request.features ?? existingPlan.features,
      request.cta ?? existingPlan.cta,
      request.highlighted !== undefined ? request.highlighted : existingPlan.highlighted,
      request.status ?? existingPlan.status,
      request.promotion !== undefined
        ? request.promotion
          ? {
              active: request.promotion.active,
              discountPercent: request.promotion.discountPercent,
              label: request.promotion.label,
              validUntil: request.promotion.validUntil,
            }
          : null
        : existingPlan.promotion,
      request.order !== undefined ? request.order : existingPlan.order,
      existingPlan.createdAt,
      new Date(), // updatedAt se actualiza automáticamente
    );

    // Guardar los cambios
    const savedPlan = await this.pricingPlanRepository.update(updatedPlan);

    return new UpdatePricingPlanResponse(savedPlan);
  }
}

