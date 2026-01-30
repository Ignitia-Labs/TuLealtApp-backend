import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PartnerSubscription,
  ITenantRepository,
  ICustomerMembershipRepository,
  LoyaltyEvent,
} from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper } from '@libs/infrastructure';
import { ProcessLoyaltyEventHandler } from './process-loyalty-event/process-loyalty-event.handler';

/**
 * Servicio puente para convertir eventos de suscripción de partners a eventos de lealtad
 * Este servicio es opcional y se puede usar cuando se quiere otorgar puntos a customers
 * cuando un partner renueva o activa su suscripción
 *
 * NOTA: Por defecto, los eventos SUBSCRIPTION en el sistema de lealtad son para
 * suscripciones de customers a servicios del tenant, no para suscripciones de partners.
 * Este servicio permite conectar ambos sistemas si es necesario.
 */
@Injectable()
export class SubscriptionLoyaltyBridgeService {
  constructor(
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    private readonly processLoyaltyEventHandler: ProcessLoyaltyEventHandler,
  ) {}

  /**
   * Convierte un evento de suscripción de partner a eventos de lealtad
   * Opción 1: Otorgar puntos a todos los customers del partner (todos los tenants)
   * Opción 2: Otorgar puntos solo a customers de un tenant específico
   *
   * Por ahora, implementamos Opción 1: todos los customers del partner
   */
  async processPartnerSubscriptionEvent(
    subscriptionId: number,
    subscriptionEventType: 'activated' | 'renewed',
    tenantId?: number | null, // Si se especifica, solo otorgar a ese tenant
  ): Promise<void> {
    // Obtener la suscripción
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });
    if (!subscriptionEntity) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }
    const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);

    // Determinar a qué tenants aplicar
    let tenantIds: number[] = [];

    if (tenantId) {
      // Solo el tenant especificado
      const tenant = await this.tenantRepository.findById(tenantId);
      if (!tenant || tenant.partnerId !== subscription.partnerId) {
        throw new Error(`Tenant ${tenantId} does not belong to partner ${subscription.partnerId}`);
      }
      tenantIds = [tenantId];
    } else {
      // Todos los tenants del partner
      const tenants = await this.tenantRepository.findByPartnerId(subscription.partnerId);
      tenantIds = tenants.map((t) => t.id);
    }

    // Para cada tenant, obtener todos los memberships activos y crear eventos
    for (const tid of tenantIds) {
      const allMemberships = await this.membershipRepository.findByTenantId(tid);
      const memberships = allMemberships.filter((m) => m.status === 'active');

      for (const membership of memberships) {
        try {
          // Crear evento de lealtad SUBSCRIPTION
          const loyaltyEvent: Partial<LoyaltyEvent> = {
            tenantId: tid,
            eventType: 'SUBSCRIPTION',
            sourceEventId: `SUBSCRIPTION-${subscription.id}-${subscriptionEventType}-${membership.id}-${Date.now()}`,
            occurredAt: new Date(),
            membershipRef: {
              membershipId: membership.id,
            },
            payload: {
              subscriptionId: subscription.id,
              subscriptionType: subscriptionEventType === 'activated' ? 'STARTED' : 'RENEWED',
              planId: subscription.planId || null,
              planName: subscription.planType || null,
              amount: subscription.billingAmount || null,
              currency: subscription.currency || null,
              metadata: {
                partnerId: subscription.partnerId,
                subscriptionStatus: subscription.status,
              },
            },
            createdBy: 'SYSTEM',
            metadata: {
              partnerSubscriptionId: subscription.id,
              subscriptionAgeMonths: this.calculateSubscriptionAgeMonths(subscription),
            },
          };

          // Procesar evento de lealtad
          await this.processLoyaltyEventHandler.execute(loyaltyEvent);
        } catch (error) {
          // Log error pero continuar con otros memberships
          console.warn(
            `Error processing subscription loyalty event for membership ${membership.id}:`,
            error,
          );
        }
      }
    }
  }

  /**
   * Calcula la antigüedad de la suscripción en meses
   */
  private calculateSubscriptionAgeMonths(subscription: PartnerSubscription): number {
    const now = new Date();
    const startDate = subscription.startDate || subscription.createdAt || now;
    const diffTime = now.getTime() - startDate.getTime();
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30)); // Aproximación
    return Math.max(0, diffMonths);
  }
}
