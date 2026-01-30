import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ILoyaltyProgramRepository,
  ITenantRepository,
  IPricingPlanRepository,
  LoyaltyProgram,
  EarningDomain,
  isValidEarningDomain,
} from '@libs/domain';
import {
  PartnerSubscriptionEntity,
  PartnerSubscriptionUsageEntity,
} from '@libs/infrastructure';
import { SubscriptionUsageHelper } from '@libs/application';
import { LoyaltyProgramValidator } from '../loyalty-program-validator.service';
import { CreateLoyaltyProgramRequest } from './create-loyalty-program.request';
import { CreateLoyaltyProgramResponse } from './create-loyalty-program.response';

/**
 * Handler para crear un nuevo programa de lealtad
 */
@Injectable()
export class CreateLoyaltyProgramHandler {
  constructor(
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    private readonly programValidator: LoyaltyProgramValidator,
  ) {}

  async execute(request: CreateLoyaltyProgramRequest): Promise<CreateLoyaltyProgramResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Obtener límites del plan desde pricing_plan_limits
    const planLimits = await SubscriptionUsageHelper.getPlanLimitsForPartner(
      tenant.partnerId,
      this.subscriptionRepository,
      this.pricingPlanRepository,
    );

    if (planLimits) {
      // Contar programas existentes del tenant
      const existingPrograms = await this.programRepository.findByTenantId(request.tenantId);
      const totalProgramsCount = existingPrograms.length;

      // Contar programas por tipo
      const programsByType = await this.programRepository.findByTenantIdAndType(
        request.tenantId,
        request.programType,
      );
      const typeCount = programsByType.length;

      // Validar límite total de programas
      if (!planLimits.canCreateLoyaltyProgram(totalProgramsCount)) {
        throw new BadRequestException(
          `Cannot create loyalty program: maximum total programs limit reached (${planLimits.maxLoyaltyPrograms === -1 ? 'unlimited' : planLimits.maxLoyaltyPrograms}). Current count: ${totalProgramsCount}`,
        );
      }

      // Validar límite por tipo específico
      if (!planLimits.canCreateLoyaltyProgramType(request.programType, typeCount)) {
        const typeLimit = planLimits.getLoyaltyProgramTypeLimit(request.programType);
        throw new BadRequestException(
          `Cannot create loyalty program of type ${request.programType}: maximum limit reached (${typeLimit === -1 ? 'unlimited' : typeLimit}). Current count: ${typeCount}`,
        );
      }
    }

    // Validar earning domains
    const earningDomains = request.earningDomains.map((item) => {
      if (!isValidEarningDomain(item.domain)) {
        throw new BadRequestException(
          `Invalid earning domain: ${item.domain}. Must be one of the valid earning domains.`,
        );
      }
      return { domain: item.domain as EarningDomain };
    });

    // Para programas BASE, asegurar que tenga BASE_PURCHASE si no está vacío
    if (request.programType === 'BASE' && earningDomains.length > 0) {
      const hasBasePurchase = earningDomains.some((d) => d.domain === 'BASE_PURCHASE');
      if (!hasBasePurchase) {
        // Agregar BASE_PURCHASE automáticamente
        earningDomains.unshift({ domain: 'BASE_PURCHASE' });
      }
    }

    // Crear programa usando factory method
    const program = LoyaltyProgram.create(
      request.tenantId,
      request.name,
      request.programType,
      earningDomains,
      request.priorityRank ?? 0,
      {
        allowed: request.stacking.allowed,
        maxProgramsPerEvent: request.stacking.maxProgramsPerEvent,
        maxProgramsPerPeriod: request.stacking.maxProgramsPerPeriod,
        period: request.stacking.period,
        selectionStrategy: request.stacking.selectionStrategy,
      },
      {
        enabled: request.expirationPolicy.enabled,
        type: request.expirationPolicy.type,
        daysToExpire: request.expirationPolicy.daysToExpire,
        gracePeriodDays: request.expirationPolicy.gracePeriodDays,
      },
      request.minPointsToRedeem ?? 0,
      request.description ?? null,
      request.limits
        ? {
            maxPointsPerEvent: request.limits.maxPointsPerEvent,
            maxPointsPerDay: request.limits.maxPointsPerDay,
            maxPointsPerMonth: request.limits.maxPointsPerMonth,
            maxPointsPerYear: request.limits.maxPointsPerYear,
          }
        : null,
      request.currency ?? null,
      request.status ?? 'draft',
      1, // version
      request.activeFrom ? new Date(request.activeFrom) : null,
      request.activeTo ? new Date(request.activeTo) : null,
    );

    // Validar programa según reglas anti-caos
    await this.programValidator.validateProgram(program);

    // Guardar programa
    const savedProgram = await this.programRepository.save(program);

    // Actualizar contadores de loyalty programs en partner_subscription_usage
    try {
      const subscriptionId = await SubscriptionUsageHelper.getSubscriptionIdFromTenantId(
        request.tenantId,
        this.tenantRepository,
        this.subscriptionRepository,
      );

      if (subscriptionId) {
        // Incrementar contador según el tipo de programa
        switch (request.programType) {
          case 'BASE':
            await SubscriptionUsageHelper.incrementLoyaltyProgramsBaseCount(
              subscriptionId,
              this.usageRepository,
            );
            break;
          case 'PROMO':
            await SubscriptionUsageHelper.incrementLoyaltyProgramsPromoCount(
              subscriptionId,
              this.usageRepository,
            );
            break;
          case 'PARTNER':
            await SubscriptionUsageHelper.incrementLoyaltyProgramsPartnerCount(
              subscriptionId,
              this.usageRepository,
            );
            break;
          case 'SUBSCRIPTION':
            await SubscriptionUsageHelper.incrementLoyaltyProgramsSubscriptionCount(
              subscriptionId,
              this.usageRepository,
            );
            break;
          case 'EXPERIMENTAL':
            await SubscriptionUsageHelper.incrementLoyaltyProgramsExperimentalCount(
              subscriptionId,
              this.usageRepository,
            );
            break;
          default:
            // Si el tipo no está reconocido, solo incrementar el total
            await SubscriptionUsageHelper.incrementLoyaltyProgramsCount(
              subscriptionId,
              this.usageRepository,
            );
        }
      }
    } catch (error) {
      // Log error pero no lanzar excepción para no interrumpir la creación del programa
      console.error(
        `[CreateLoyaltyProgramHandler] Error updating subscription usage for loyalty program ${savedProgram.id}:`,
        error,
      );
    }

    return new CreateLoyaltyProgramResponse(savedProgram);
  }
}
