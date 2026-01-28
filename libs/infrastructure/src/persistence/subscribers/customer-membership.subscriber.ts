import { EventSubscriber, EntitySubscriberInterface, RemoveEvent, Repository, In } from 'typeorm';
import { CustomerMembershipEntity } from '../entities/customer-membership.entity';
import { PartnerSubscriptionUsageEntity } from '../entities/partner-subscription-usage.entity';
import { PartnerSubscriptionEntity } from '../entities/partner-subscription.entity';
import { TenantEntity } from '../entities/tenant.entity';

/**
 * Subscriber de TypeORM para CustomerMembershipEntity
 * Captura eventos de eliminación (incluyendo eliminaciones por CASCADE)
 * y actualiza el contador de customers en subscription_usage
 *
 * IMPORTANTE: Este subscriber solo se ejecuta para eliminaciones que usan
 * `remove()` o `softRemove()`, NO para `delete()` que ejecuta SQL directo.
 *
 * Casos de uso:
 * 1. Eliminación de User → CASCADE elimina customer_memberships usando `remove()` → ✅ Se ejecuta
 * 2. Eliminación de Tenant → CASCADE elimina customer_memberships usando `remove()` → ✅ Se ejecuta
 * 3. Eliminación manual vía DeleteCustomerMembershipHandler → usa `delete()` → ❌ NO se ejecuta
 *    (el handler maneja el decremento directamente)
 *
 * Esta separación evita duplicación: el handler maneja eliminaciones manuales,
 * el subscriber maneja eliminaciones por CASCADE.
 *
 * NOTA: Este subscriber NO usa @Injectable() ni inyecta DataSource para evitar dependencias circulares.
 * Obtiene los repositorios desde el event.manager/connection.
 */
@EventSubscriber()
export class CustomerMembershipSubscriber
  implements EntitySubscriberInterface<CustomerMembershipEntity>
{
  /**
   * Wrapper para obtener subscriptionId desde tenantId usando repositorios de TypeORM directamente
   * Esto evita la necesidad de inyectar el TenantRepository de dominio
   */
  private async getSubscriptionIdFromTenantId(
    tenantId: number,
    tenantRepository: Repository<TenantEntity>,
    subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ): Promise<number | null> {
    try {
      const tenant = await tenantRepository.findOne({
        where: { id: tenantId },
      });

      if (!tenant) {
        return null;
      }

      // Optimizado: Obtener todas las suscripciones válidas en una sola query
      const validSubscriptions = await subscriptionRepository.find({
        where: { partnerId: tenant.partnerId, status: In(['active', 'trialing', 'past_due']) },
        order: { createdAt: 'DESC' },
      });

      if (validSubscriptions.length === 0) {
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

      return validSubscriptions[0].id;
    } catch (error) {
      console.error(`Error getting subscription ID for tenant ${tenantId}:`, error);
      return null;
    }
  }

  /**
   * Decrementa el contador de customers en subscription_usage
   * Implementación local para evitar dependencias circulares con @libs/application
   */
  private async decrementCustomersCount(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      // Asegurar que el registro de uso existe
      await this.ensureUsageRecordExists(subscriptionId, usageRepository);

      // Decrementar el contador
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
      // No lanzar excepción para no interrumpir la eliminación
    }
  }

  /**
   * Asegura que existe un registro de uso para la suscripción
   */
  private async ensureUsageRecordExists(
    subscriptionId: number,
    usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ): Promise<void> {
    try {
      const existingUsage = await usageRepository.findOne({
        where: { partnerSubscriptionId: subscriptionId },
      });

      if (!existingUsage) {
        // Crear nuevo registro de uso con valores iniciales en 0
        const usageEntity = usageRepository.create({
          partnerSubscriptionId: subscriptionId,
          tenantsCount: 0,
          branchesCount: 0,
          customersCount: 0,
          rewardsCount: 0,
        });
        await usageRepository.save(usageEntity);
      }
    } catch (error) {
      console.error(
        `Error ensuring usage record exists for subscription ${subscriptionId}:`,
        error,
      );
      // No lanzar excepción para no interrumpir la eliminación
    }
  }

  /**
   * Especifica la entidad a la que este subscriber escucha
   */
  listenTo(): typeof CustomerMembershipEntity {
    return CustomerMembershipEntity;
  }

  /**
   * Se ejecuta ANTES de eliminar una membership
   * Capturamos el tenantId antes de que se elimine para poder actualizar el contador
   *
   * NOTA: Este método solo se ejecuta para eliminaciones que usan `remove()` o `softRemove()`.
   * Las eliminaciones que usan `delete()` (como en DeleteCustomerMembershipHandler) NO
   * disparan este evento, por lo que no hay riesgo de duplicación.
   */
  async beforeRemove(event: RemoveEvent<CustomerMembershipEntity>): Promise<void> {
    try {
      const membership = event.entity;

      if (!membership) {
        return;
      }

      // Obtener el tenantId antes de eliminar
      const tenantId = membership.tenantId;

      if (!tenantId) {
        console.warn(
          '[CustomerMembershipSubscriber] Membership without tenantId, skipping subscription usage update',
        );
        return;
      }

      // Obtener repositorios necesarios desde el connection del evento
      // Esto evita necesidad de inyectar DataSource
      const connection = event.manager.connection;
      const subscriptionRepository = connection.getRepository(PartnerSubscriptionEntity);
      const usageRepository = connection.getRepository(PartnerSubscriptionUsageEntity);
      const tenantRepository = connection.getRepository(TenantEntity);

      // Obtener el subscriptionId desde el tenantId
      const subscriptionId = await this.getSubscriptionIdFromTenantId(
        tenantId,
        tenantRepository,
        subscriptionRepository,
      );

      if (subscriptionId) {
        // Decrementar el contador de customers usando el mismo método que SubscriptionUsageHelper
        await this.decrementCustomersCount(subscriptionId, usageRepository);

        console.log(
          `[CustomerMembershipSubscriber] Decremented customers count for subscription ${subscriptionId} (tenantId: ${tenantId}, membershipId: ${membership.id})`,
        );
      } else {
        console.warn(
          `[CustomerMembershipSubscriber] Could not find subscription for tenantId ${tenantId}, skipping subscription usage update`,
        );
      }
    } catch (error) {
      // Log error pero no lanzar excepción para no interrumpir la eliminación
      console.error(
        '[CustomerMembershipSubscriber] Error updating subscription usage on membership deletion:',
        error,
      );
    }
  }
}
