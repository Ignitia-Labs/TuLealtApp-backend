import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscriptionUsage } from '@libs/domain';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  PartnerSubscriptionUsageMapper,
} from '@libs/infrastructure';

/**
 * Servicio helper para manejar la creación y actualización automática
 * del registro de uso de suscripción
 */
@Injectable()
export class SubscriptionUsageService {
  private readonly logger = new Logger(SubscriptionUsageService.name);

  constructor(
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  /**
   * Crea automáticamente un registro de uso para una suscripción
   * Si ya existe, no hace nada
   */
  async createUsageForSubscription(
    partnerSubscriptionId: number,
  ): Promise<PartnerSubscriptionUsageEntity | null> {
    try {
      // Verificar si ya existe un registro de uso
      const existingUsage = await this.usageRepository.findOne({
        where: { partnerSubscriptionId },
      });

      if (existingUsage) {
        this.logger.debug(`Usage record already exists for subscription ${partnerSubscriptionId}`);
        return existingUsage;
      }

      // Crear el registro de uso con valores iniciales en 0
      const usage = PartnerSubscriptionUsage.create(partnerSubscriptionId, 0, 0, 0, 0);
      const usageEntity = PartnerSubscriptionUsageMapper.toPersistence(usage);
      const savedEntity = await this.usageRepository.save(usageEntity);

      this.logger.log(`Created usage record for subscription ${partnerSubscriptionId}`);
      return savedEntity;
    } catch (error) {
      this.logger.error(
        `Error creating usage record for subscription ${partnerSubscriptionId}:`,
        error,
      );
      // No lanzar error para no interrumpir el flujo principal
      return null;
    }
  }

  /**
   * Obtiene el partnerSubscriptionId desde un partnerId
   */
  async getSubscriptionIdFromPartnerId(partnerId: number): Promise<number | null> {
    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { partnerId },
        order: { createdAt: 'DESC' },
      });

      return subscription ? subscription.id : null;
    } catch (error) {
      this.logger.error(`Error getting subscription ID for partner ${partnerId}:`, error);
      return null;
    }
  }

  /**
   * Obtiene el partnerSubscriptionId desde un tenantId
   */
  async getSubscriptionIdFromTenantId(tenantId: number): Promise<number | null> {
    try {
      const subscription = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .innerJoin('partners', 'partner', 'partner.id = subscription.partnerId')
        .innerJoin('tenants', 'tenant', 'tenant.partnerId = partner.id')
        .where('tenant.id = :tenantId', { tenantId })
        .orderBy('subscription.createdAt', 'DESC')
        .getOne();

      return subscription ? subscription.id : null;
    } catch (error) {
      this.logger.error(`Error getting subscription ID for tenant ${tenantId}:`, error);
      return null;
    }
  }

  /**
   * Incrementa el contador de tenants
   */
  async incrementTenantsCount(partnerSubscriptionId: number): Promise<void> {
    try {
      await this.updateCounter(partnerSubscriptionId, 'tenantsCount', 1);
    } catch (error) {
      this.logger.error(
        `Error incrementing tenants count for subscription ${partnerSubscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Decrementa el contador de tenants
   */
  async decrementTenantsCount(partnerSubscriptionId: number): Promise<void> {
    try {
      await this.updateCounter(partnerSubscriptionId, 'tenantsCount', -1);
    } catch (error) {
      this.logger.error(
        `Error decrementing tenants count for subscription ${partnerSubscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Incrementa el contador de branches
   */
  async incrementBranchesCount(partnerSubscriptionId: number): Promise<void> {
    try {
      await this.updateCounter(partnerSubscriptionId, 'branchesCount', 1);
    } catch (error) {
      this.logger.error(
        `Error incrementing branches count for subscription ${partnerSubscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Decrementa el contador de branches
   */
  async decrementBranchesCount(partnerSubscriptionId: number): Promise<void> {
    try {
      await this.updateCounter(partnerSubscriptionId, 'branchesCount', -1);
    } catch (error) {
      this.logger.error(
        `Error decrementing branches count for subscription ${partnerSubscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Incrementa el contador de customers
   */
  async incrementCustomersCount(partnerSubscriptionId: number): Promise<void> {
    try {
      await this.updateCounter(partnerSubscriptionId, 'customersCount', 1);
    } catch (error) {
      this.logger.error(
        `Error incrementing customers count for subscription ${partnerSubscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Decrementa el contador de customers
   */
  async decrementCustomersCount(partnerSubscriptionId: number): Promise<void> {
    try {
      await this.updateCounter(partnerSubscriptionId, 'customersCount', -1);
    } catch (error) {
      this.logger.error(
        `Error decrementing customers count for subscription ${partnerSubscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Incrementa el contador de rewards
   */
  async incrementRewardsCount(partnerSubscriptionId: number): Promise<void> {
    try {
      await this.updateCounter(partnerSubscriptionId, 'rewardsCount', 1);
    } catch (error) {
      this.logger.error(
        `Error incrementing rewards count for subscription ${partnerSubscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Decrementa el contador de rewards
   */
  async decrementRewardsCount(partnerSubscriptionId: number): Promise<void> {
    try {
      await this.updateCounter(partnerSubscriptionId, 'rewardsCount', -1);
    } catch (error) {
      this.logger.error(
        `Error decrementing rewards count for subscription ${partnerSubscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Método privado para actualizar un contador
   */
  private async updateCounter(
    partnerSubscriptionId: number,
    counterName: 'tenantsCount' | 'branchesCount' | 'customersCount' | 'rewardsCount',
    delta: number,
  ): Promise<void> {
    // Asegurar que existe el registro de uso
    let usageEntity = await this.usageRepository.findOne({
      where: { partnerSubscriptionId },
    });

    if (!usageEntity) {
      // Crear el registro si no existe
      await this.createUsageForSubscription(partnerSubscriptionId);
      usageEntity = await this.usageRepository.findOne({
        where: { partnerSubscriptionId },
      });

      if (!usageEntity) {
        this.logger.warn(`Could not create usage record for subscription ${partnerSubscriptionId}`);
        return;
      }
    }

    // Actualizar el contador usando SQL para evitar condiciones de carrera
    const currentValue = usageEntity[counterName] || 0;
    const newValue = Math.max(0, currentValue + delta); // No permitir valores negativos

    await this.usageRepository.update({ partnerSubscriptionId }, { [counterName]: newValue });

    this.logger.debug(
      `Updated ${counterName} for subscription ${partnerSubscriptionId}: ${currentValue} -> ${newValue}`,
    );
  }
}
