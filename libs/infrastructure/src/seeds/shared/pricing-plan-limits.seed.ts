import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPricingPlanRepository, PricingPlanLimits } from '@libs/domain';
import { PricingPlanLimitsEntity, PricingPlanLimitsMapper } from '@libs/infrastructure';
import { BaseSeed } from '../base/base-seed';

/**
 * Seed para actualizar los límites de loyalty programs de los planes de precios existentes
 */
@Injectable()
export class PricingPlanLimitsSeed extends BaseSeed {
  constructor(
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
    @InjectRepository(PricingPlanLimitsEntity)
    private readonly limitsRepository: Repository<PricingPlanLimitsEntity>,
  ) {
    super();
  }

  getName(): string {
    return 'PricingPlanLimitsSeed';
  }

  async run(): Promise<void> {
    this.log('Iniciando seed de límites de loyalty programs para planes de precios...');

    try {
      // Obtener todos los planes
      const plans = await this.pricingPlanRepository.findAll(true);

      for (const plan of plans) {
        await this.updatePlanLimits(plan.slug, plan.id);
      }

      this.log('Seeds de límites de loyalty programs completadas');
    } catch (error) {
      this.error('Error al actualizar límites de loyalty programs', error);
      throw error;
    }
  }

  private async updatePlanLimits(slug: string, planId: number): Promise<void> {
    // Definir límites según el plan
    let limits: {
      maxLoyaltyPrograms: number;
      maxLoyaltyProgramsBase: number;
      maxLoyaltyProgramsPromo: number;
      maxLoyaltyProgramsPartner: number;
      maxLoyaltyProgramsSubscription: number;
      maxLoyaltyProgramsExperimental: number;
    };

    switch (slug) {
      case 'esencia':
        // Plan básico: 1 programa BASE, sin otros tipos
        limits = {
          maxLoyaltyPrograms: 1,
          maxLoyaltyProgramsBase: 1,
          maxLoyaltyProgramsPromo: 0,
          maxLoyaltyProgramsPartner: 0,
          maxLoyaltyProgramsSubscription: 0,
          maxLoyaltyProgramsExperimental: 0,
        };
        break;

      case 'conecta':
        // Plan intermedio: 1 BASE, 3 PROMO, total 4
        limits = {
          maxLoyaltyPrograms: 4,
          maxLoyaltyProgramsBase: 1,
          maxLoyaltyProgramsPromo: 3,
          maxLoyaltyProgramsPartner: 0,
          maxLoyaltyProgramsSubscription: 0,
          maxLoyaltyProgramsExperimental: 0,
        };
        break;

      case 'inspira':
        // Plan premium: ilimitado
        limits = {
          maxLoyaltyPrograms: -1,
          maxLoyaltyProgramsBase: -1,
          maxLoyaltyProgramsPromo: -1,
          maxLoyaltyProgramsPartner: -1,
          maxLoyaltyProgramsSubscription: -1,
          maxLoyaltyProgramsExperimental: -1,
        };
        break;

      default:
        // Por defecto: valores conservadores
        limits = {
          maxLoyaltyPrograms: 1,
          maxLoyaltyProgramsBase: 1,
          maxLoyaltyProgramsPromo: 0,
          maxLoyaltyProgramsPartner: 0,
          maxLoyaltyProgramsSubscription: 0,
          maxLoyaltyProgramsExperimental: 0,
        };
    }

    // Buscar límites existentes
    const existingLimits = await this.limitsRepository.findOne({
      where: { pricingPlanId: planId },
    });

    if (existingLimits) {
      // Actualizar límites existentes
      existingLimits.maxLoyaltyPrograms = limits.maxLoyaltyPrograms;
      existingLimits.maxLoyaltyProgramsBase = limits.maxLoyaltyProgramsBase;
      existingLimits.maxLoyaltyProgramsPromo = limits.maxLoyaltyProgramsPromo;
      existingLimits.maxLoyaltyProgramsPartner = limits.maxLoyaltyProgramsPartner;
      existingLimits.maxLoyaltyProgramsSubscription = limits.maxLoyaltyProgramsSubscription;
      existingLimits.maxLoyaltyProgramsExperimental = limits.maxLoyaltyProgramsExperimental;
      existingLimits.updatedAt = new Date();

      await this.limitsRepository.save(existingLimits);
      this.log(`Límites de loyalty programs actualizados para plan ${slug} (ID: ${planId})`);
    } else {
      // Crear nuevos límites si no existen
      // Primero necesitamos obtener los otros límites del plan
      const plan = await this.pricingPlanRepository.findById(planId);
      if (plan && plan.limits) {
        // Crear límites completos con los valores existentes y los nuevos de loyalty programs
        const newLimits = PricingPlanLimits.create(
          planId,
          plan.limits.maxTenants,
          plan.limits.maxBranches,
          plan.limits.maxCustomers,
          plan.limits.maxRewards,
          plan.limits.maxAdmins,
          plan.limits.storageGB,
          plan.limits.apiCallsPerMonth,
          limits.maxLoyaltyPrograms,
          limits.maxLoyaltyProgramsBase,
          limits.maxLoyaltyProgramsPromo,
          limits.maxLoyaltyProgramsPartner,
          limits.maxLoyaltyProgramsSubscription,
          limits.maxLoyaltyProgramsExperimental,
          plan.limits.id,
        );

        const limitsEntity = PricingPlanLimitsMapper.toPersistence(newLimits);
        await this.limitsRepository.save(limitsEntity);
        this.log(`Límites de loyalty programs creados para plan ${slug} (ID: ${planId})`);
      } else {
        // Si el plan no tiene límites, crear límites por defecto
        const defaultLimits = PricingPlanLimits.create(
          planId,
          1, // maxTenants
          1, // maxBranches
          -1, // maxCustomers (ilimitado)
          -1, // maxRewards (ilimitado)
          -1, // maxAdmins (ilimitado)
          -1, // storageGB (ilimitado)
          -1, // apiCallsPerMonth (ilimitado)
          limits.maxLoyaltyPrograms,
          limits.maxLoyaltyProgramsBase,
          limits.maxLoyaltyProgramsPromo,
          limits.maxLoyaltyProgramsPartner,
          limits.maxLoyaltyProgramsSubscription,
          limits.maxLoyaltyProgramsExperimental,
        );

        const limitsEntity = PricingPlanLimitsMapper.toPersistence(defaultLimits);
        await this.limitsRepository.save(limitsEntity);
        this.log(`Límites completos creados para plan ${slug} (ID: ${planId})`);
      }
    }
  }
}
