import { PartnerSubscription } from '@libs/domain/entities/partner/partner-subscription.entity';

/**
 * Interfaz del repositorio de PartnerSubscription
 * Define los contratos para persistir y recuperar suscripciones de partners
 */
export interface IPartnerSubscriptionRepository {
  /**
   * Busca una suscripción por el ID del partner
   */
  findByPartnerId(partnerId: number): Promise<PartnerSubscription | null>;

  /**
   * Busca una suscripción por su ID
   */
  findById(id: number): Promise<PartnerSubscription | null>;

  /**
   * Actualiza una suscripción existente
   */
  update(subscription: PartnerSubscription): Promise<PartnerSubscription>;
}
