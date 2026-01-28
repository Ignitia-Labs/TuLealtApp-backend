import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { IPricingPlanRepository, PricingPlan, PricingPlanLimits } from '@libs/domain';
import { CreatePricingPlanRequest } from './create-pricing-plan.request';
import { CreatePricingPlanResponse } from './create-pricing-plan.response';

/**
 * Handler para el caso de uso de crear un plan de precios
 */
@Injectable()
export class CreatePricingPlanHandler {
  constructor(
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
  ) {}

  async execute(request: CreatePricingPlanRequest): Promise<CreatePricingPlanResponse> {
    // Validar que el slug no exista
    const existingPlan = await this.pricingPlanRepository.findBySlug(request.slug);
    if (existingPlan) {
      throw new BadRequestException(`Pricing plan with slug ${request.slug} already exists`);
    }

    // Convertir DTOs a tipos de dominio
    const pricing = {
      monthly: request.pricing.monthly ?? null,
      quarterly: request.pricing.quarterly ?? null,
      semiannual: request.pricing.semiannual ?? null,
      annual: request.pricing.annual ?? null,
    };

    const promotions = request.promotions
      ? {
          monthly: request.promotions.monthly,
          quarterly: request.promotions.quarterly,
          semiannual: request.promotions.semiannual,
          annual: request.promotions.annual,
        }
      : null;

    const promotion = request.promotion
      ? {
          active: request.promotion.active,
          discountPercent: request.promotion.discountPercent,
          label: request.promotion.label,
          validUntil: request.promotion.validUntil,
        }
      : null;

    // Crear limits si se proporcionan
    const limits = request.limits
      ? PricingPlanLimits.create(
          0, // pricingPlanId se asignará después de crear el plan
          request.limits.maxTenants ?? -1,
          request.limits.maxBranches ?? -1,
          request.limits.maxCustomers ?? -1,
          request.limits.maxRewards ?? -1,
          request.limits.maxAdmins ?? -1,
          request.limits.storageGB ?? -1,
          request.limits.apiCallsPerMonth ?? -1,
        )
      : null;

    // Crear la entidad de dominio sin ID (la BD lo generará automáticamente)
    const plan = PricingPlan.create(
      request.name,
      request.icon,
      request.slug,
      request.basePrice ?? null,
      request.period ?? '',
      pricing,
      promotions,
      request.description,
      request.features,
      request.cta,
      request.highlighted,
      request.status,
      promotion,
      request.order,
      undefined, // trialDays (default)
      undefined, // popular (default)
      limits,
    );

    // Guardar usando el repositorio (la BD asignará el ID automáticamente)
    const savedPlan = await this.pricingPlanRepository.save(plan);

    return new CreatePricingPlanResponse(savedPlan);
  }
}
