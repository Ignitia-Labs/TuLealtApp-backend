import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  TenantEntity,
  BranchEntity,
  PartnerLimitsEntity,
  CustomerMembershipEntity,
} from '@libs/infrastructure';
import { SubscriptionUsageHelper } from '../subscription-usage.helper';
import { RecalculateSubscriptionUsageRequest } from './recalculate-subscription-usage.request';
import { RecalculateSubscriptionUsageResponse } from './recalculate-subscription-usage.response';

/**
 * Handler para el caso de uso de recalcular el uso de suscripción
 * Permite recalcular un partner específico o todos los partners activos
 */
@Injectable()
export class RecalculateSubscriptionUsageHandler {
  private readonly logger = new Logger(RecalculateSubscriptionUsageHandler.name);

  constructor(
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
    @InjectRepository(CustomerMembershipEntity)
    private readonly customerMembershipRepository: Repository<CustomerMembershipEntity>,
    @InjectRepository(PartnerLimitsEntity)
    private readonly limitsRepository: Repository<PartnerLimitsEntity>,
  ) {}

  async execute(
    request: RecalculateSubscriptionUsageRequest,
  ): Promise<RecalculateSubscriptionUsageResponse> {
    const results: Array<{
      partnerId: number;
      partnerSubscriptionId: number;
      tenantsCount: number;
      branchesCount: number;
      customersCount: number;
      rewardsCount: number;
    }> = [];

    // Si se proporciona partnerSubscriptionId, recalcular solo esa suscripción
    if (request.partnerSubscriptionId) {
      this.logger.log(`Recalculating usage for subscription ${request.partnerSubscriptionId}`);

      const subscription = await this.subscriptionRepository.findOne({
        where: { id: request.partnerSubscriptionId },
      });

      if (!subscription) {
        throw new Error(`Subscription with ID ${request.partnerSubscriptionId} not found`);
      }

      await SubscriptionUsageHelper.recalculateUsageForSubscription(
        request.partnerSubscriptionId,
        this.usageRepository,
        this.tenantRepository,
        this.branchRepository,
        this.customerMembershipRepository,
        subscription.partnerId,
      );

      // Obtener el resultado actualizado
      const usageEntity = await this.usageRepository.findOne({
        where: { partnerSubscriptionId: request.partnerSubscriptionId },
      });

      // Obtener límites del partner
      const limitsEntity = await this.limitsRepository.findOne({
        where: { partnerId: subscription.partnerId },
      });

      if (usageEntity) {
        this.logger.log(
          `Partner ${subscription.partnerId} - Usage: tenants=${usageEntity.tenantsCount}, branches=${usageEntity.branchesCount}, customers=${usageEntity.customersCount}`,
        );
        if (limitsEntity) {
          this.logger.log(
            `Partner ${subscription.partnerId} - Limits: maxTenants=${limitsEntity.maxTenants}, maxBranches=${limitsEntity.maxBranches}`,
          );
        }

        results.push({
          partnerId: subscription.partnerId,
          partnerSubscriptionId: request.partnerSubscriptionId,
          tenantsCount: usageEntity.tenantsCount,
          branchesCount: usageEntity.branchesCount,
          customersCount: usageEntity.customersCount,
          rewardsCount: usageEntity.rewardsCount,
        });
      }
    }
    // Si se proporciona partnerId, recalcular solo ese partner
    else if (request.partnerId) {
      this.logger.log(`Recalculating usage for partner ${request.partnerId}`);

      // Para recálculo manual, permitir cualquier status de suscripción
      await SubscriptionUsageHelper.recalculateUsageForPartner(
        request.partnerId,
        this.subscriptionRepository,
        this.usageRepository,
        this.tenantRepository,
        this.branchRepository,
        this.customerMembershipRepository,
        true, // allowAnyStatus = true para recálculo manual
      );

      // Obtener el resultado actualizado (buscar cualquier suscripción, no solo activa)
      let subscription = await this.subscriptionRepository.findOne({
        where: { partnerId: request.partnerId, status: 'active' },
        order: { createdAt: 'DESC' },
      });

      // Si no hay activa, buscar la más reciente sin importar status
      if (!subscription) {
        subscription = await this.subscriptionRepository.findOne({
          where: { partnerId: request.partnerId },
          order: { createdAt: 'DESC' },
        });
      }

      if (subscription) {
        const usageEntity = await this.usageRepository.findOne({
          where: { partnerSubscriptionId: subscription.id },
        });

        // Obtener límites del partner
        const limitsEntity = await this.limitsRepository.findOne({
          where: { partnerId: request.partnerId },
        });

        if (usageEntity) {
          this.logger.log(
            `Partner ${request.partnerId} - Usage: tenants=${usageEntity.tenantsCount}, branches=${usageEntity.branchesCount}`,
          );
          if (limitsEntity) {
            this.logger.log(
              `Partner ${request.partnerId} - Limits: maxTenants=${limitsEntity.maxTenants}, maxBranches=${limitsEntity.maxBranches}`,
            );
          }

          results.push({
            partnerId: request.partnerId,
            partnerSubscriptionId: subscription.id,
            tenantsCount: usageEntity.tenantsCount,
            branchesCount: usageEntity.branchesCount,
            customersCount: usageEntity.customersCount,
            rewardsCount: usageEntity.rewardsCount,
          });
        }
      }
    }
    // Si no se proporciona ninguno, recalcular todos los partners (con cualquier suscripción)
    else {
      this.logger.log('Recalculating usage for all partners');

      // Primero obtener todas las suscripciones activas
      const activeSubscriptions = await this.subscriptionRepository.find({
        where: { status: 'active' },
        order: { createdAt: 'DESC' },
      });

      // Agrupar por partnerId para evitar duplicados (tomar la más reciente)
      const subscriptionsByPartner = new Map<number, PartnerSubscriptionEntity>();
      for (const subscription of activeSubscriptions) {
        if (!subscriptionsByPartner.has(subscription.partnerId)) {
          subscriptionsByPartner.set(subscription.partnerId, subscription);
        }
      }

      // También obtener partners que tienen tenants pero no tienen suscripción activa
      // Obtener todos los partners únicos que tienen tenants
      const partnersWithTenants = await this.tenantRepository
        .createQueryBuilder('tenant')
        .select('DISTINCT tenant.partnerId', 'partnerId')
        .getRawMany();

      // Para cada partner que tiene tenants, asegurarse de que tiene una suscripción
      for (const partnerRow of partnersWithTenants) {
        const partnerId = partnerRow.partnerId;
        if (!subscriptionsByPartner.has(partnerId)) {
          // Buscar cualquier suscripción para este partner (no solo activa)
          const anySubscription = await this.subscriptionRepository.findOne({
            where: { partnerId },
            order: { createdAt: 'DESC' },
          });
          if (anySubscription) {
            subscriptionsByPartner.set(partnerId, anySubscription);
            this.logger.log(
              `Found subscription ${anySubscription.id} (status: ${anySubscription.status}) for partner ${partnerId} without active subscription`,
            );
          }
        }
      }

      // Recalcular cada partner
      for (const subscription of subscriptionsByPartner.values()) {
        try {
          await SubscriptionUsageHelper.recalculateUsageForSubscription(
            subscription.id,
            this.usageRepository,
            this.tenantRepository,
            this.branchRepository,
            this.customerMembershipRepository,
            subscription.partnerId,
          );

          // Obtener el resultado actualizado
          const usageEntity = await this.usageRepository.findOne({
            where: { partnerSubscriptionId: subscription.id },
          });

          // Obtener límites del partner
          const limitsEntity = await this.limitsRepository.findOne({
            where: { partnerId: subscription.partnerId },
          });

          if (usageEntity) {
            this.logger.log(
              `Partner ${subscription.partnerId} - Usage: tenants=${usageEntity.tenantsCount}, branches=${usageEntity.branchesCount}`,
            );
            if (limitsEntity) {
              this.logger.log(
                `Partner ${subscription.partnerId} - Limits: maxTenants=${limitsEntity.maxTenants}, maxBranches=${limitsEntity.maxBranches}`,
              );
            }

            results.push({
              partnerId: subscription.partnerId,
              partnerSubscriptionId: subscription.id,
              tenantsCount: usageEntity.tenantsCount,
              branchesCount: usageEntity.branchesCount,
              customersCount: usageEntity.customersCount,
              rewardsCount: usageEntity.rewardsCount,
            });
          }
        } catch (error) {
          this.logger.error(
            `Error recalculating usage for partner ${subscription.partnerId}:`,
            error,
          );
          // Continuar con el siguiente partner
        }
      }
    }

    this.logger.log(`Recalculation completed. ${results.length} partners processed.`);

    return new RecalculateSubscriptionUsageResponse(
      'Subscription usage recalculated successfully',
      results.length,
      results,
    );
  }
}
