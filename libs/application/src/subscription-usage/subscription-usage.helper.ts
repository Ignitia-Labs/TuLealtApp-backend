import { Repository, In } from 'typeorm';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  TenantEntity,
  BranchEntity,
} from '@libs/infrastructure';
import { PartnerSubscriptionUsageMapper } from '@libs/infrastructure';
import { PartnerSubscriptionUsage } from '@libs/domain';

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
   */
  static async getSubscriptionIdFromPartnerId(
    partnerId: number,
    subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ): Promise<number | null> {
    try {
      const subscription = await subscriptionRepository.findOne({
        where: { partnerId, status: 'active' },
        order: { createdAt: 'DESC' },
      });
      return subscription?.id || null;
    } catch (error) {
      console.error(`Error getting subscription ID for partner ${partnerId}:`, error);
      return null;
    }
  }

  /**
   * Obtiene el subscriptionId desde un tenantId
   */
  static async getSubscriptionIdFromTenantId(
    tenantId: number,
    tenantRepository: any, // ITenantRepository
    subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ): Promise<number | null> {
    try {
      const tenant = await tenantRepository.findById(tenantId);
      if (!tenant) {
        return null;
      }

      return this.getSubscriptionIdFromPartnerId(tenant.partnerId, subscriptionRepository);
    } catch (error) {
      console.error(`Error getting subscription ID for tenant ${tenantId}:`, error);
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
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      await usageRepository.increment(
        { partnerSubscriptionId: subscriptionId },
        'customersCount',
        1,
      );
    } catch (error) {
      console.error(
        `Error incrementing customers count for subscription ${subscriptionId}:`,
        error,
      );
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
    allowAnyStatus: boolean = true, // Para recálculo manual, permitir cualquier status
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
        partnerId,
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
   */
  static async recalculateUsageForSubscription(
    partnerSubscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    tenantRepository: Repository<TenantEntity>,
    branchRepository: Repository<BranchEntity>,
    partnerId?: number,
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

      // Actualizar solo tenantsCount y branchesCount
      // customersCount y rewardsCount se mantienen (se actualizarán por otros procesos)
      usageEntity.tenantsCount = tenantsCount;
      usageEntity.branchesCount = branchesCount;

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
      const existingUsage = await usageRepository.findOne({
        where: { partnerSubscriptionId: subscriptionId },
      });

      if (!existingUsage) {
        console.log(
          `[SubscriptionUsageHelper] Creating usage record for subscription ${subscriptionId}`,
        );
        // Crear nuevo registro de uso con valores iniciales en 0
        const usage = PartnerSubscriptionUsage.create(
          subscriptionId,
          0, // tenantsCount
          0, // branchesCount
          0, // customersCount
          0, // rewardsCount
        );

        const usageEntity = PartnerSubscriptionUsageMapper.toPersistence(usage);
        const saved = await usageRepository.save(usageEntity);
        console.log(
          `[SubscriptionUsageHelper] Created usage record with ID ${saved.id} for subscription ${subscriptionId}`,
        );
      } else {
        console.log(
          `[SubscriptionUsageHelper] Usage record already exists for subscription ${subscriptionId}`,
        );
      }
    } catch (error) {
      console.error(
        `[SubscriptionUsageHelper] Error ensuring usage record exists for subscription ${subscriptionId}:`,
        error,
      );
      // No lanzar excepción para no interrumpir el flujo principal
    }
  }
}
