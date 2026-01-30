import { Repository, In } from 'typeorm';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  TenantEntity,
  BranchEntity,
  CustomerMembershipEntity,
  LoyaltyProgramEntity,
  RewardRuleEntity,
} from '@libs/infrastructure';
import { PartnerSubscriptionUsageMapper } from '@libs/infrastructure';
import { PartnerSubscriptionUsage, IPricingPlanRepository, PricingPlanLimits } from '@libs/domain';

/**
 * Helper functions para manejar la creación y actualización automática
 * del registro de uso de suscripción
 * Estas funciones reciben los repositorios como parámetros para evitar problemas de DI
 */
export class SubscriptionUsageHelper {
  /**
   * Crea automáticamente un registro de uso para una suscripción
   * Si ya existe, no hace nada
   */
  static async createUsageForSubscription(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Verificar si ya existe un registro de uso para esta suscripción
      const existingUsage = await usageRepository.findOne({
        where: { partnerSubscriptionId: subscriptionId },
      });

      if (existingUsage) {
        // Ya existe, no hacer nada
        return;
      }

      // Crear nuevo registro de uso con valores iniciales en 0
      const usage = PartnerSubscriptionUsage.create(
        subscriptionId,
        0, // tenantsCount
        0, // branchesCount
        0, // customersCount
        0, // rewardsCount
        0, // loyaltyProgramsCount
        0, // loyaltyProgramsBaseCount
        0, // loyaltyProgramsPromoCount
        0, // loyaltyProgramsPartnerCount
        0, // loyaltyProgramsSubscriptionCount
        0, // loyaltyProgramsExperimentalCount
      );

      const usageEntity = PartnerSubscriptionUsageMapper.toPersistence(usage);
      await usageRepository.save(usageEntity);
    } catch (error) {
      // Log error pero no lanzar excepción para no interrumpir el flujo principal
      console.error(`Error creating subscription usage for subscription ${subscriptionId}:`, error);
    }
  }

  /**
   * Obtiene el subscriptionId desde un partnerId
   * Solo busca suscripciones con status 'active', 'trialing' o 'past_due'
   * Prioriza 'active', luego 'trialing', luego 'past_due'
   *
   * Optimizado: Usa UNA SOLA query en lugar de 3 queries secuenciales
   */
  static async getSubscriptionIdFromPartnerId(
    partnerId: number,
    subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ): Promise<number | null> {
    try {
      console.log(
        `[SubscriptionUsageHelper] Searching for subscription with partnerId ${partnerId} and status in ['active', 'trialing', 'past_due']`,
      );

      // Obtener todas las suscripciones válidas en una sola query
      const validSubscriptions = await subscriptionRepository.find({
        where: { partnerId, status: In(['active', 'trialing', 'past_due']) },
        order: { createdAt: 'DESC' },
      });

      console.log(
        `[SubscriptionUsageHelper] Found ${validSubscriptions.length} valid subscription(s) for partnerId ${partnerId}`,
      );

      if (validSubscriptions.length > 0) {
        validSubscriptions.forEach((sub, index) => {
          console.log(
            `[SubscriptionUsageHelper] Subscription ${index + 1}: id=${sub.id}, status=${sub.status}, createdAt=${sub.createdAt}`,
          );
        });
      }

      if (validSubscriptions.length === 0) {
        console.warn(
          `[SubscriptionUsageHelper] No valid subscriptions found for partnerId ${partnerId}`,
        );
        return null;
      }

      // Prioridad: active > trialing > past_due
      const statusPriority: Record<string, number> = {
        active: 1,
        trialing: 2,
        past_due: 3,
      };

      validSubscriptions.sort((a, b) => {
        const priorityA = statusPriority[a.status] || 999;
        const priorityB = statusPriority[b.status] || 999;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        // Si tienen la misma prioridad, ordenar por fecha (más reciente primero)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      const selectedSubscriptionId = validSubscriptions[0].id;
      console.log(
        `[SubscriptionUsageHelper] Selected subscription ${selectedSubscriptionId} (status: ${validSubscriptions[0].status}) for partnerId ${partnerId}`,
      );

      return selectedSubscriptionId;
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] Error getting subscription ID for partner ${partnerId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Obtiene el subscriptionId desde un tenantId
   * Primero busca una suscripción activa, si no encuentra, busca la más reciente sin importar status
   */
  static async getSubscriptionIdFromTenantId(
    tenantId: number,
    tenantRepository: any, // ITenantRepository
    subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ): Promise<number | null> {
    try {
      console.log(`[SubscriptionUsageHelper] Getting subscription ID for tenantId ${tenantId}`);

      const tenant = await tenantRepository.findById(tenantId);
      if (!tenant) {
        console.warn(`[SubscriptionUsageHelper] Tenant ${tenantId} not found`);
        return null;
      }

      console.log(
        `[SubscriptionUsageHelper] Tenant ${tenantId} belongs to partnerId ${tenant.partnerId}`,
      );

      return this.getSubscriptionIdFromPartnerId(tenant.partnerId, subscriptionRepository);
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] Error getting subscription ID for tenant ${tenantId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Incrementa el contador de tenants
   * Crea el registro de uso si no existe
   */
  static async incrementTenantsCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      console.log(
        `[SubscriptionUsageHelper] Incrementing tenants count for subscription ${subscriptionId}`,
      );
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      const result = await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'tenantsCount',
        1,
      );
      console.log(
        `[SubscriptionUsageHelper] Incremented tenants count for subscription ${subscriptionId}. Affected rows: ${result.affected || 0}`,
      );
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] Error incrementing tenants count for subscription ${subscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Decrementa el contador de tenants
   * Crea el registro de uso si no existe
   */
  static async decrementTenantsCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.decrement({ partnerSubscriptionId: subscriptionId }, 'tenantsCount', 1);
      // Asegurar que no sea negativo
      await usageRepository
        .createQueryBuilder()
        .update(PartnerSubscriptionUsageEntity)
        .set({ tenantsCount: () => 'GREATEST(tenantsCount, 0)' })
        .where('partnerSubscriptionId = :subscriptionId', { subscriptionId })
        .execute();
    } catch (error) {
      console.error(`Error decrementing tenants count for subscription ${subscriptionId}:`, error);
    }
  }

  /**
   * Incrementa el contador de branches
   * Crea el registro de uso si no existe
   */
  static async incrementBranchesCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'branchesCount',
        1,
      );
    } catch (error) {
      console.error(`Error incrementing branches count for subscription ${subscriptionId}:`, error);
    }
  }

  /**
   * Decrementa el contador de branches
   * Crea el registro de uso si no existe
   */
  static async decrementBranchesCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'branchesCount',
        1,
      );
      // Asegurar que no sea negativo
      await usageRepository
        .createQueryBuilder()
        .update(PartnerSubscriptionUsageEntity)
        .set({ branchesCount: () => 'GREATEST(branchesCount, 0)' })
        .where('partnerSubscriptionId = :subscriptionId', { subscriptionId })
        .execute();
    } catch (error) {
      console.error(`Error decrementing branches count for subscription ${subscriptionId}:`, error);
    }
  }

  /**
   * Incrementa el contador de customers
   * Crea el registro de uso si no existe
   */
  static async incrementCustomersCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      console.log(
        `[SubscriptionUsageHelper] Incrementing customers count for subscription ${subscriptionId}`,
      );

      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      const result = await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'customersCount',
        1,
      );

      console.log(
        `[SubscriptionUsageHelper] ✓ Incremented customers count for subscription ${subscriptionId}. Affected rows: ${result.affected || 0}`,
      );
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] ✗ Error incrementing customers count for subscription ${subscriptionId}:`,
        error,
      );
      throw error; // Lanzar error para que el llamador pueda manejarlo
    }
  }

  /**
   * Decrementa el contador de customers
   * Crea el registro de uso si no existe
   */
  static async decrementCustomersCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'customersCount',
        1,
      );
      // Asegurar que no sea negativo
      await usageRepository
        .createQueryBuilder()
        .update(PartnerSubscriptionUsageEntity)
        .set({ customersCount: () => 'GREATEST(customersCount, 0)' })
        .where('partnerSubscriptionId = :subscriptionId', { subscriptionId })
        .execute();
    } catch (error) {
      console.error(
        `Error decrementing customers count for subscription ${subscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Incrementa el contador de rewards
   * Crea el registro de uso si no existe
   */
  static async incrementRewardsCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.increment({ partnerSubscriptionId: subscriptionId }, 'rewardsCount', 1);
    } catch (error) {
      console.error(`Error incrementing rewards count for subscription ${subscriptionId}:`, error);
    }
  }

  /**
   * Decrementa el contador de rewards
   * Crea el registro de uso si no existe
   */
  static async decrementRewardsCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.decrement({ partnerSubscriptionId: subscriptionId }, 'rewardsCount', 1);
      // Asegurar que no sea negativo
      await usageRepository
        .createQueryBuilder()
        .update(PartnerSubscriptionUsageEntity)
        .set({ rewardsCount: () => 'GREATEST(rewardsCount, 0)' })
        .where('partnerSubscriptionId = :subscriptionId', { subscriptionId })
        .execute();
    } catch (error) {
      console.error(`Error decrementing rewards count for subscription ${subscriptionId}:`, error);
    }
  }

  /**
   * Incrementa el contador total de loyalty programs
   * Crea el registro de uso si no existe
   */
  static async incrementLoyaltyProgramsCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      console.log(
        `[SubscriptionUsageHelper] Incrementing loyalty programs count for subscription ${subscriptionId}`,
      );

      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      const result = await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsCount',
        1,
      );

      console.log(
        `[SubscriptionUsageHelper] ✓ Incremented loyalty programs count for subscription ${subscriptionId}. Affected rows: ${result.affected || 0}`,
      );
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] ✗ Error incrementing loyalty programs count for subscription ${subscriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Incrementa el contador de loyalty programs tipo BASE y el total
   * Crea el registro de uso si no existe
   */
  static async incrementLoyaltyProgramsBaseCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      console.log(
        `[SubscriptionUsageHelper] Incrementing loyalty programs BASE count for subscription ${subscriptionId}`,
      );

      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      // Incrementar ambos contadores en una transacción
      await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsCount',
        1,
      );
      await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsBaseCount',
        1,
      );

      console.log(
        `[SubscriptionUsageHelper] ✓ Incremented loyalty programs BASE count for subscription ${subscriptionId}`,
      );
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] ✗ Error incrementing loyalty programs BASE count for subscription ${subscriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Incrementa el contador de loyalty programs tipo PROMO y el total
   * Crea el registro de uso si no existe
   */
  static async incrementLoyaltyProgramsPromoCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      console.log(
        `[SubscriptionUsageHelper] Incrementing loyalty programs PROMO count for subscription ${subscriptionId}`,
      );

      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsCount',
        1,
      );
      await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsPromoCount',
        1,
      );

      console.log(
        `[SubscriptionUsageHelper] ✓ Incremented loyalty programs PROMO count for subscription ${subscriptionId}`,
      );
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] ✗ Error incrementing loyalty programs PROMO count for subscription ${subscriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Incrementa el contador de loyalty programs tipo PARTNER y el total
   * Crea el registro de uso si no existe
   */
  static async incrementLoyaltyProgramsPartnerCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      console.log(
        `[SubscriptionUsageHelper] Incrementing loyalty programs PARTNER count for subscription ${subscriptionId}`,
      );

      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsCount',
        1,
      );
      await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsPartnerCount',
        1,
      );

      console.log(
        `[SubscriptionUsageHelper] ✓ Incremented loyalty programs PARTNER count for subscription ${subscriptionId}`,
      );
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] ✗ Error incrementing loyalty programs PARTNER count for subscription ${subscriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Incrementa el contador de loyalty programs tipo SUBSCRIPTION y el total
   * Crea el registro de uso si no existe
   */
  static async incrementLoyaltyProgramsSubscriptionCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      console.log(
        `[SubscriptionUsageHelper] Incrementing loyalty programs SUBSCRIPTION count for subscription ${subscriptionId}`,
      );

      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsCount',
        1,
      );
      await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsSubscriptionCount',
        1,
      );

      console.log(
        `[SubscriptionUsageHelper] ✓ Incremented loyalty programs SUBSCRIPTION count for subscription ${subscriptionId}`,
      );
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] ✗ Error incrementing loyalty programs SUBSCRIPTION count for subscription ${subscriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Incrementa el contador de loyalty programs tipo EXPERIMENTAL y el total
   * Crea el registro de uso si no existe
   */
  static async incrementLoyaltyProgramsExperimentalCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      console.log(
        `[SubscriptionUsageHelper] Incrementing loyalty programs EXPERIMENTAL count for subscription ${subscriptionId}`,
      );

      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsCount',
        1,
      );
      await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsExperimentalCount',
        1,
      );

      console.log(
        `[SubscriptionUsageHelper] ✓ Incremented loyalty programs EXPERIMENTAL count for subscription ${subscriptionId}`,
      );
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] ✗ Error incrementing loyalty programs EXPERIMENTAL count for subscription ${subscriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Decrementa el contador total de loyalty programs
   * Crea el registro de uso si no existe
   */
  static async decrementLoyaltyProgramsCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsCount',
        1,
      );
      // Asegurar que no sea negativo
      await usageRepository
        .createQueryBuilder()
        .update(PartnerSubscriptionUsageEntity)
        .set({ loyaltyProgramsCount: () => 'GREATEST(loyaltyProgramsCount, 0)' })
        .where('partnerSubscriptionId = :subscriptionId', { subscriptionId })
        .execute();
    } catch (error) {
      console.error(
        `Error decrementing loyalty programs count for subscription ${subscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Decrementa el contador de loyalty programs tipo BASE y el total
   * Crea el registro de uso si no existe
   */
  static async decrementLoyaltyProgramsBaseCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsCount',
        1,
      );
      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsBaseCount',
        1,
      );
      // Asegurar que no sean negativos
      await usageRepository
        .createQueryBuilder()
        .update(PartnerSubscriptionUsageEntity)
        .set({
          loyaltyProgramsCount: () => 'GREATEST(loyaltyProgramsCount, 0)',
          loyaltyProgramsBaseCount: () => 'GREATEST(loyaltyProgramsBaseCount, 0)',
        })
        .where('partnerSubscriptionId = :subscriptionId', { subscriptionId })
        .execute();
    } catch (error) {
      console.error(
        `Error decrementing loyalty programs BASE count for subscription ${subscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Decrementa el contador de loyalty programs tipo PROMO y el total
   * Crea el registro de uso si no existe
   */
  static async decrementLoyaltyProgramsPromoCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsCount',
        1,
      );
      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsPromoCount',
        1,
      );
      // Asegurar que no sean negativos
      await usageRepository
        .createQueryBuilder()
        .update(PartnerSubscriptionUsageEntity)
        .set({
          loyaltyProgramsCount: () => 'GREATEST(loyaltyProgramsCount, 0)',
          loyaltyProgramsPromoCount: () => 'GREATEST(loyaltyProgramsPromoCount, 0)',
        })
        .where('partnerSubscriptionId = :subscriptionId', { subscriptionId })
        .execute();
    } catch (error) {
      console.error(
        `Error decrementing loyalty programs PROMO count for subscription ${subscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Decrementa el contador de loyalty programs tipo PARTNER y el total
   * Crea el registro de uso si no existe
   */
  static async decrementLoyaltyProgramsPartnerCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsCount',
        1,
      );
      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsPartnerCount',
        1,
      );
      // Asegurar que no sean negativos
      await usageRepository
        .createQueryBuilder()
        .update(PartnerSubscriptionUsageEntity)
        .set({
          loyaltyProgramsCount: () => 'GREATEST(loyaltyProgramsCount, 0)',
          loyaltyProgramsPartnerCount: () => 'GREATEST(loyaltyProgramsPartnerCount, 0)',
        })
        .where('partnerSubscriptionId = :subscriptionId', { subscriptionId })
        .execute();
    } catch (error) {
      console.error(
        `Error decrementing loyalty programs PARTNER count for subscription ${subscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Decrementa el contador de loyalty programs tipo SUBSCRIPTION y el total
   * Crea el registro de uso si no existe
   */
  static async decrementLoyaltyProgramsSubscriptionCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsCount',
        1,
      );
      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsSubscriptionCount',
        1,
      );
      // Asegurar que no sean negativos
      await usageRepository
        .createQueryBuilder()
        .update(PartnerSubscriptionUsageEntity)
        .set({
          loyaltyProgramsCount: () => 'GREATEST(loyaltyProgramsCount, 0)',
          loyaltyProgramsSubscriptionCount: () => 'GREATEST(loyaltyProgramsSubscriptionCount, 0)',
        })
        .where('partnerSubscriptionId = :subscriptionId', { subscriptionId })
        .execute();
    } catch (error) {
      console.error(
        `Error decrementing loyalty programs SUBSCRIPTION count for subscription ${subscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Decrementa el contador de loyalty programs tipo EXPERIMENTAL y el total
   * Crea el registro de uso si no existe
   */
  static async decrementLoyaltyProgramsExperimentalCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsCount',
        1,
      );
      await usageRepository.decrement(
        { partnerSubscriptionId: subscriptionId },
        'loyaltyProgramsExperimentalCount',
        1,
      );
      // Asegurar que no sean negativos
      await usageRepository
        .createQueryBuilder()
        .update(PartnerSubscriptionUsageEntity)
        .set({
          loyaltyProgramsCount: () => 'GREATEST(loyaltyProgramsCount, 0)',
          loyaltyProgramsExperimentalCount: () => 'GREATEST(loyaltyProgramsExperimentalCount, 0)',
        })
        .where('partnerSubscriptionId = :subscriptionId', { subscriptionId })
        .execute();
    } catch (error) {
      console.error(
        `Error decrementing loyalty programs EXPERIMENTAL count for subscription ${subscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Recalcula el uso de suscripción para un partner específico desde los datos reales de la BD
   * Solo afecta al partner especificado
   * Para recálculo manual, busca la suscripción más reciente (no solo activa)
   */
  static async recalculateUsageForPartner(
    partnerId: number,
    subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    tenantRepository: Repository<TenantEntity>,
    branchRepository: Repository<BranchEntity>,
    customerMembershipRepository: Repository<CustomerMembershipEntity>,
    allowAnyStatus: boolean = true, // Para recálculo manual, permitir cualquier status
    loyaltyProgramRepository?: Repository<LoyaltyProgramEntity>,
    rewardRuleRepository?: Repository<RewardRuleEntity>,
  ): Promise<void> {
    try {
      // Primero intentar obtener la suscripción activa
      let subscription = await subscriptionRepository.findOne({
        where: { partnerId, status: 'active' },
        order: { createdAt: 'DESC' },
      });

      // Si no hay activa y allowAnyStatus es true, buscar la más reciente sin importar status
      if (!subscription && allowAnyStatus) {
        subscription = await subscriptionRepository.findOne({
          where: { partnerId },
          order: { createdAt: 'DESC' },
        });
      }

      if (!subscription) {
        console.log(
          `[SubscriptionUsageHelper] No subscription found for partner ${partnerId}. Skipping recalculation.`,
        );
        return;
      }

      console.log(
        `[SubscriptionUsageHelper] Using subscription ${subscription.id} (status: ${subscription.status}) for partner ${partnerId}`,
      );

      await this.recalculateUsageForSubscription(
        subscription.id,
        usageRepository,
        tenantRepository,
        branchRepository,
        customerMembershipRepository,
        partnerId,
        loyaltyProgramRepository,
        rewardRuleRepository,
      );
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] Error recalculating usage for partner ${partnerId}:`,
        error,
      );
      // No lanzar excepción para no interrumpir el flujo principal
    }
  }

  /**
   * Recalcula el uso de suscripción para una suscripción específica desde los datos reales de la BD
   * Solo afecta a la suscripción especificada
   * Recalcula tenantsCount, branchesCount y customersCount
   */
  static async recalculateUsageForSubscription(
    partnerSubscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    tenantRepository: Repository<TenantEntity>,
    branchRepository: Repository<BranchEntity>,
    customerMembershipRepository: Repository<CustomerMembershipEntity>,
    partnerId?: number,
    loyaltyProgramRepository?: Repository<LoyaltyProgramEntity>,
    rewardRuleRepository?: Repository<RewardRuleEntity>,
  ): Promise<void> {
    try {
      // Si no se proporciona partnerId, obtenerlo desde la suscripción
      let actualPartnerId = partnerId;
      if (!actualPartnerId) {
        const subscription = await usageRepository.manager.findOne(PartnerSubscriptionEntity, {
          where: { id: partnerSubscriptionId },
        });
        if (!subscription) {
          console.log(
            `[SubscriptionUsageHelper] Subscription ${partnerSubscriptionId} not found. Skipping recalculation.`,
          );
          return;
        }
        actualPartnerId = subscription.partnerId;
      }

      console.log(
        `[SubscriptionUsageHelper] Recalculating usage for subscription ${partnerSubscriptionId} (partner ${actualPartnerId})`,
      );

      // Contar tenants del partner (sin filtrar por estado)
      const tenantsCount = await tenantRepository
        .createQueryBuilder('tenant')
        .where('tenant.partnerId = :partnerId', { partnerId: actualPartnerId })
        .getCount();

      console.log(
        `[SubscriptionUsageHelper] Found ${tenantsCount} tenants for partner ${actualPartnerId}`,
      );

      // Obtener todos los tenantIds del partner
      const tenants = await tenantRepository
        .createQueryBuilder('tenant')
        .select('tenant.id', 'id')
        .where('tenant.partnerId = :partnerId', { partnerId: actualPartnerId })
        .getRawMany();

      const tenantIds = tenants.map((t) => t.id);
      console.log(
        `[SubscriptionUsageHelper] Tenant IDs for partner ${actualPartnerId}: [${tenantIds.join(', ')}]`,
      );

      // Contar branches de todos los tenants del partner (SIN filtrar por estado - contar TODAS)
      let branchesCount = 0;
      if (tenantIds.length > 0) {
        // Usar query builder para tener más control y logs
        const branchesQuery = branchRepository
          .createQueryBuilder('branch')
          .where('branch.tenantId IN (:...tenantIds)', { tenantIds });

        branchesCount = await branchesQuery.getCount();

        // Log detallado de branches por tenant para debug
        for (const tenantId of tenantIds) {
          const branchCountForTenant = await branchRepository
            .createQueryBuilder('branch')
            .where('branch.tenantId = :tenantId', { tenantId })
            .getCount();
          console.log(
            `[SubscriptionUsageHelper] Tenant ${tenantId} has ${branchCountForTenant} branches`,
          );
        }
      }

      console.log(
        `[SubscriptionUsageHelper] Total branches count for partner ${actualPartnerId}: ${branchesCount}`,
      );

      // Contar customers (customer_memberships) de todos los tenants del partner
      let customersCount = 0;
      if (tenantIds.length > 0) {
        customersCount = await customerMembershipRepository
          .createQueryBuilder('membership')
          .where('membership.tenantId IN (:...tenantIds)', { tenantIds })
          .getCount();

        // Log detallado de customers por tenant para debug
        for (const tenantId of tenantIds) {
          const customerCountForTenant = await customerMembershipRepository
            .createQueryBuilder('membership')
            .where('membership.tenantId = :tenantId', { tenantId })
            .getCount();
          console.log(
            `[SubscriptionUsageHelper] Tenant ${tenantId} has ${customerCountForTenant} customers`,
          );
        }
      }

      console.log(
        `[SubscriptionUsageHelper] Total customers count for partner ${actualPartnerId}: ${customersCount}`,
      );

      // Contar rewards (RewardRule activas) de todos los programas de lealtad activos de los tenants del partner
      let rewardsCount = 0;
      if (tenantIds.length > 0 && loyaltyProgramRepository && rewardRuleRepository) {
        const now = new Date();

        // Obtener todos los programas de lealtad activos de los tenants del partner
        const activePrograms = await loyaltyProgramRepository
          .createQueryBuilder('program')
          .where('program.tenantId IN (:...tenantIds)', { tenantIds })
          .andWhere('program.status = :status', { status: 'active' })
          .andWhere('(program.activeFrom IS NULL OR program.activeFrom <= :now)', { now })
          .andWhere('(program.activeTo IS NULL OR program.activeTo >= :now)', { now })
          .getMany();

        const programIds = activePrograms.map((p) => p.id);

        if (programIds.length > 0) {
          // Contar reglas activas de todos los programas
          rewardsCount = await rewardRuleRepository
            .createQueryBuilder('rule')
            .where('rule.programId IN (:...programIds)', { programIds })
            .andWhere('rule.status = :status', { status: 'active' })
            .andWhere('(rule.activeFrom IS NULL OR rule.activeFrom <= :now)', { now })
            .andWhere('(rule.activeTo IS NULL OR rule.activeTo >= :now)', { now })
            .getCount();

          console.log(
            `[SubscriptionUsageHelper] Found ${activePrograms.length} active loyalty programs with ${rewardsCount} active reward rules for partner ${actualPartnerId}`,
          );
        } else {
          console.log(
            `[SubscriptionUsageHelper] No active loyalty programs found for partner ${actualPartnerId}`,
          );
        }
      } else if (tenantIds.length > 0 && (!loyaltyProgramRepository || !rewardRuleRepository)) {
        console.warn(
          `[SubscriptionUsageHelper] Loyalty program or reward rule repositories not provided. Skipping rewardsCount calculation.`,
        );
      }

      // Contar loyalty programs por tipo de todos los tenants del partner
      let loyaltyProgramsCount = 0;
      let loyaltyProgramsBaseCount = 0;
      let loyaltyProgramsPromoCount = 0;
      let loyaltyProgramsPartnerCount = 0;
      let loyaltyProgramsSubscriptionCount = 0;
      let loyaltyProgramsExperimentalCount = 0;

      if (tenantIds.length > 0 && loyaltyProgramRepository) {
        const now = new Date();

        // Obtener todos los programas de lealtad activos de los tenants del partner
        const activePrograms = await loyaltyProgramRepository
          .createQueryBuilder('program')
          .where('program.tenantId IN (:...tenantIds)', { tenantIds })
          .andWhere('program.status = :status', { status: 'active' })
          .andWhere('(program.activeFrom IS NULL OR program.activeFrom <= :now)', { now })
          .andWhere('(program.activeTo IS NULL OR program.activeTo >= :now)', { now })
          .getMany();

        loyaltyProgramsCount = activePrograms.length;

        // Contar por tipo
        for (const program of activePrograms) {
          switch (program.programType) {
            case 'BASE':
              loyaltyProgramsBaseCount++;
              break;
            case 'PROMO':
              loyaltyProgramsPromoCount++;
              break;
            case 'PARTNER':
              loyaltyProgramsPartnerCount++;
              break;
            case 'SUBSCRIPTION':
              loyaltyProgramsSubscriptionCount++;
              break;
            case 'EXPERIMENTAL':
              loyaltyProgramsExperimentalCount++;
              break;
          }
        }

        console.log(
          `[SubscriptionUsageHelper] Found ${loyaltyProgramsCount} active loyalty programs for partner ${actualPartnerId}:`,
        );
        console.log(
          `  - BASE: ${loyaltyProgramsBaseCount}, PROMO: ${loyaltyProgramsPromoCount}, PARTNER: ${loyaltyProgramsPartnerCount}, SUBSCRIPTION: ${loyaltyProgramsSubscriptionCount}, EXPERIMENTAL: ${loyaltyProgramsExperimentalCount}`,
        );
      } else if (tenantIds.length > 0 && !loyaltyProgramRepository) {
        console.warn(
          `[SubscriptionUsageHelper] Loyalty program repository not provided. Skipping loyalty programs count calculation.`,
        );
      }

      // Asegurar que existe el registro de uso
      await this.ensureUsageRecordExists(partnerSubscriptionId, usageRepository);

      // Obtener el registro de uso existente
      const usageEntity = await usageRepository.findOne({
        where: { partnerSubscriptionId },
      });

      if (!usageEntity) {
        console.warn(
          `[SubscriptionUsageHelper] Could not find or create usage record for subscription ${partnerSubscriptionId}`,
        );
        return;
      }

      // Guardar valores anteriores para comparación
      const previousTenantsCount = usageEntity.tenantsCount;
      const previousBranchesCount = usageEntity.branchesCount;
      const previousCustomersCount = usageEntity.customersCount;
      const previousRewardsCount = usageEntity.rewardsCount;
      const previousLoyaltyProgramsCount = usageEntity.loyaltyProgramsCount ?? 0;
      const previousLoyaltyProgramsBaseCount = usageEntity.loyaltyProgramsBaseCount ?? 0;
      const previousLoyaltyProgramsPromoCount = usageEntity.loyaltyProgramsPromoCount ?? 0;
      const previousLoyaltyProgramsPartnerCount = usageEntity.loyaltyProgramsPartnerCount ?? 0;
      const previousLoyaltyProgramsSubscriptionCount = usageEntity.loyaltyProgramsSubscriptionCount ?? 0;
      const previousLoyaltyProgramsExperimentalCount = usageEntity.loyaltyProgramsExperimentalCount ?? 0;

      // Actualizar tenantsCount, branchesCount, customersCount y rewardsCount
      usageEntity.tenantsCount = tenantsCount;
      usageEntity.branchesCount = branchesCount;
      usageEntity.customersCount = customersCount;
      if (rewardsCount > 0 || (loyaltyProgramRepository && rewardRuleRepository)) {
        // Solo actualizar si se calculó o si los repositorios están disponibles
        usageEntity.rewardsCount = rewardsCount;
      }

      // Actualizar loyalty programs counts si se calcularon
      if (loyaltyProgramRepository) {
        usageEntity.loyaltyProgramsCount = loyaltyProgramsCount;
        usageEntity.loyaltyProgramsBaseCount = loyaltyProgramsBaseCount;
        usageEntity.loyaltyProgramsPromoCount = loyaltyProgramsPromoCount;
        usageEntity.loyaltyProgramsPartnerCount = loyaltyProgramsPartnerCount;
        usageEntity.loyaltyProgramsSubscriptionCount = loyaltyProgramsSubscriptionCount;
        usageEntity.loyaltyProgramsExperimentalCount = loyaltyProgramsExperimentalCount;
      }

      await usageRepository.save(usageEntity);

      console.log(
        `[SubscriptionUsageHelper] Recalculated usage for subscription ${partnerSubscriptionId}:`,
      );
      console.log(
        `  - Tenants: ${previousTenantsCount} → ${tenantsCount} ${previousTenantsCount !== tenantsCount ? '⚠️ CHANGED' : '✓'}`,
      );
      console.log(
        `  - Branches: ${previousBranchesCount} → ${branchesCount} ${previousBranchesCount !== branchesCount ? '⚠️ CHANGED' : '✓'}`,
      );
      console.log(
        `  - Customers: ${previousCustomersCount} → ${customersCount} ${previousCustomersCount !== customersCount ? '⚠️ CHANGED' : '✓'}`,
      );
      if (rewardsCount > 0 || (loyaltyProgramRepository && rewardRuleRepository)) {
        console.log(
          `  - Rewards: ${previousRewardsCount} → ${rewardsCount} ${previousRewardsCount !== rewardsCount ? '⚠️ CHANGED' : '✓'}`,
        );
      }
      if (loyaltyProgramRepository) {
        console.log(
          `  - Loyalty Programs (Total): ${previousLoyaltyProgramsCount} → ${loyaltyProgramsCount} ${previousLoyaltyProgramsCount !== loyaltyProgramsCount ? '⚠️ CHANGED' : '✓'}`,
        );
        console.log(
          `  - Loyalty Programs (BASE): ${previousLoyaltyProgramsBaseCount} → ${loyaltyProgramsBaseCount} ${previousLoyaltyProgramsBaseCount !== loyaltyProgramsBaseCount ? '⚠️ CHANGED' : '✓'}`,
        );
        console.log(
          `  - Loyalty Programs (PROMO): ${previousLoyaltyProgramsPromoCount} → ${loyaltyProgramsPromoCount} ${previousLoyaltyProgramsPromoCount !== loyaltyProgramsPromoCount ? '⚠️ CHANGED' : '✓'}`,
        );
        console.log(
          `  - Loyalty Programs (PARTNER): ${previousLoyaltyProgramsPartnerCount} → ${loyaltyProgramsPartnerCount} ${previousLoyaltyProgramsPartnerCount !== loyaltyProgramsPartnerCount ? '⚠️ CHANGED' : '✓'}`,
        );
        console.log(
          `  - Loyalty Programs (SUBSCRIPTION): ${previousLoyaltyProgramsSubscriptionCount} → ${loyaltyProgramsSubscriptionCount} ${previousLoyaltyProgramsSubscriptionCount !== loyaltyProgramsSubscriptionCount ? '⚠️ CHANGED' : '✓'}`,
        );
        console.log(
          `  - Loyalty Programs (EXPERIMENTAL): ${previousLoyaltyProgramsExperimentalCount} → ${loyaltyProgramsExperimentalCount} ${previousLoyaltyProgramsExperimentalCount !== loyaltyProgramsExperimentalCount ? '⚠️ CHANGED' : '✓'}`,
        );
      }
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] Error recalculating usage for subscription ${partnerSubscriptionId}:`,
        error,
      );
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      // No lanzar excepción para no interrumpir el flujo principal
    }
  }

  /**
   * Asegura que existe un registro de uso para la suscripción
   * Si no existe, lo crea con valores iniciales en 0
   */
  private static async ensureUsageRecordExists(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      console.log(
        `[SubscriptionUsageHelper] Ensuring usage record exists for subscription ${subscriptionId}`,
      );

      const existingUsage = await usageRepository.findOne({
        where: { partnerSubscriptionId: subscriptionId },
      });

      if (!existingUsage) {
        console.log(
          `[SubscriptionUsageHelper] Usage record not found. Creating new usage record for subscription ${subscriptionId}`,
        );
        // Crear nuevo registro de uso con valores iniciales en 0
        const usage = PartnerSubscriptionUsage.create(
          subscriptionId,
          0, // tenantsCount
          0, // branchesCount
          0, // customersCount
          0, // rewardsCount
          0, // loyaltyProgramsCount
          0, // loyaltyProgramsBaseCount
          0, // loyaltyProgramsPromoCount
          0, // loyaltyProgramsPartnerCount
          0, // loyaltyProgramsSubscriptionCount
          0, // loyaltyProgramsExperimentalCount
        );

        const usageEntity = PartnerSubscriptionUsageMapper.toPersistence(usage);
        const saved = await usageRepository.save(usageEntity);
        console.log(
          `[SubscriptionUsageHelper] ✓ Created usage record with ID ${saved.id} for subscription ${subscriptionId}`,
        );
      } else {
        console.log(
          `[SubscriptionUsageHelper] ✓ Usage record already exists for subscription ${subscriptionId} (id: ${existingUsage.id}, customersCount: ${existingUsage.customersCount})`,
        );
      }
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] ✗ Error ensuring usage record exists for subscription ${subscriptionId}:`,
        error,
      );
      throw error; // Lanzar error para que el llamador pueda manejarlo
    }
  }

  /**
   * Obtiene los límites del plan de precios para un partner
   * @param partnerId ID del partner
   * @param subscriptionRepository Repositorio de subscriptions
   * @param pricingPlanRepository Repositorio de pricing plans
   * @returns Límites del plan o null si no se encuentra
   */
  static async getPlanLimitsForPartner(
    partnerId: number,
    subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    pricingPlanRepository: IPricingPlanRepository,
  ): Promise<PricingPlanLimits | null> {
    try {
      // Obtener subscription activa del partner
      const subscription = await subscriptionRepository.findOne({
        where: { partnerId, status: 'active' },
      });

      if (!subscription || !subscription.planId) {
        // Intentar con otras suscripciones válidas si no hay activa
        const validSubscriptions = await subscriptionRepository.find({
          where: { partnerId, status: In(['active', 'trialing', 'past_due']) },
          order: { createdAt: 'DESC' },
        });

        if (validSubscriptions.length === 0) {
          console.warn(
            `[SubscriptionUsageHelper] No valid subscription found for partner ${partnerId}`,
          );
          return null;
        }

        const selectedSubscription = validSubscriptions[0];
        if (!selectedSubscription.planId) {
          return null;
        }

        // Obtener pricing plan
        const pricingPlan = await pricingPlanRepository.findById(
          parseInt(selectedSubscription.planId),
        );
        if (!pricingPlan || !pricingPlan.limits) {
          return null;
        }

        return pricingPlan.limits;
      }

      // Obtener pricing plan
      const pricingPlan = await pricingPlanRepository.findById(parseInt(subscription.planId));
      if (!pricingPlan || !pricingPlan.limits) {
        return null;
      }

      return pricingPlan.limits;
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] Error getting plan limits for partner ${partnerId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Obtiene el uso actual desde subscription_usage
   * @param partnerId ID del partner
   * @param subscriptionRepository Repositorio de subscriptions
   * @param usageRepository Repositorio de usage
   * @returns Uso actual o valores en 0 si no existe
   */
  static async getCurrentUsageForPartner(
    partnerId: number,
    subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<{
    tenantsCount: number;
    branchesCount: number;
    customersCount: number;
    rewardsCount: number;
    loyaltyProgramsCount: number;
    loyaltyProgramsBaseCount: number;
    loyaltyProgramsPromoCount: number;
    loyaltyProgramsPartnerCount: number;
    loyaltyProgramsSubscriptionCount: number;
    loyaltyProgramsExperimentalCount: number;
  }> {
    try {
      // Obtener subscription activa
      const subscription = await subscriptionRepository.findOne({
        where: { partnerId, status: 'active' },
        relations: ['usage'],
      });

      // Si no hay activa, buscar otras válidas
      if (!subscription) {
        const validSubscriptions = await subscriptionRepository.find({
          where: { partnerId, status: In(['active', 'trialing', 'past_due']) },
          order: { createdAt: 'DESC' },
          relations: ['usage'],
        });

        if (validSubscriptions.length === 0) {
          return {
            tenantsCount: 0,
            branchesCount: 0,
            customersCount: 0,
            rewardsCount: 0,
            loyaltyProgramsCount: 0,
            loyaltyProgramsBaseCount: 0,
            loyaltyProgramsPromoCount: 0,
            loyaltyProgramsPartnerCount: 0,
            loyaltyProgramsSubscriptionCount: 0,
            loyaltyProgramsExperimentalCount: 0,
          };
        }

        const selectedSubscription = validSubscriptions[0];
        // Obtener usage
        let usage = selectedSubscription.usage;
        if (!usage) {
          usage = await usageRepository.findOne({
            where: { partnerSubscriptionId: selectedSubscription.id },
          });
        }

        if (!usage) {
          // Crear registro si no existe
          await this.createUsageForSubscription(selectedSubscription.id, usageRepository);
          return {
            tenantsCount: 0,
            branchesCount: 0,
            customersCount: 0,
            rewardsCount: 0,
            loyaltyProgramsCount: 0,
            loyaltyProgramsBaseCount: 0,
            loyaltyProgramsPromoCount: 0,
            loyaltyProgramsPartnerCount: 0,
            loyaltyProgramsSubscriptionCount: 0,
            loyaltyProgramsExperimentalCount: 0,
          };
        }

        return {
          tenantsCount: usage.tenantsCount,
          branchesCount: usage.branchesCount,
          customersCount: usage.customersCount,
          rewardsCount: usage.rewardsCount,
          loyaltyProgramsCount: usage.loyaltyProgramsCount ?? 0,
          loyaltyProgramsBaseCount: usage.loyaltyProgramsBaseCount ?? 0,
          loyaltyProgramsPromoCount: usage.loyaltyProgramsPromoCount ?? 0,
          loyaltyProgramsPartnerCount: usage.loyaltyProgramsPartnerCount ?? 0,
          loyaltyProgramsSubscriptionCount: usage.loyaltyProgramsSubscriptionCount ?? 0,
          loyaltyProgramsExperimentalCount: usage.loyaltyProgramsExperimentalCount ?? 0,
        };
      }

      // Obtener usage
      let usage = subscription.usage;
      if (!usage) {
        usage = await usageRepository.findOne({
          where: { partnerSubscriptionId: subscription.id },
        });
      }

        if (!usage) {
          // Crear registro si no existe
          await this.createUsageForSubscription(subscription.id, usageRepository);
          return {
            tenantsCount: 0,
            branchesCount: 0,
            customersCount: 0,
            rewardsCount: 0,
            loyaltyProgramsCount: 0,
            loyaltyProgramsBaseCount: 0,
            loyaltyProgramsPromoCount: 0,
            loyaltyProgramsPartnerCount: 0,
            loyaltyProgramsSubscriptionCount: 0,
            loyaltyProgramsExperimentalCount: 0,
          };
        }

        return {
          tenantsCount: usage.tenantsCount,
          branchesCount: usage.branchesCount,
          customersCount: usage.customersCount,
          rewardsCount: usage.rewardsCount,
          loyaltyProgramsCount: usage.loyaltyProgramsCount ?? 0,
          loyaltyProgramsBaseCount: usage.loyaltyProgramsBaseCount ?? 0,
          loyaltyProgramsPromoCount: usage.loyaltyProgramsPromoCount ?? 0,
          loyaltyProgramsPartnerCount: usage.loyaltyProgramsPartnerCount ?? 0,
          loyaltyProgramsSubscriptionCount: usage.loyaltyProgramsSubscriptionCount ?? 0,
          loyaltyProgramsExperimentalCount: usage.loyaltyProgramsExperimentalCount ?? 0,
        };
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] Error getting current usage for partner ${partnerId}:`,
        error,
      );
      // Retornar valores en 0 en caso de error
      return {
        tenantsCount: 0,
        branchesCount: 0,
        customersCount: 0,
        rewardsCount: 0,
        loyaltyProgramsCount: 0,
        loyaltyProgramsBaseCount: 0,
        loyaltyProgramsPromoCount: 0,
        loyaltyProgramsPartnerCount: 0,
        loyaltyProgramsSubscriptionCount: 0,
        loyaltyProgramsExperimentalCount: 0,
      };
    }
  }
}
