import { Repository } from 'typeorm';
import { PartnerSubscriptionUsageEntity, PartnerSubscriptionEntity } from '@libs/infrastructure';
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
