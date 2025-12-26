import { SubscriptionEvent } from '../entities/subscription-event.entity';

/**
 * Interfaz del repositorio de SubscriptionEvent
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface ISubscriptionEventRepository {
  /**
   * Busca un evento por su ID
   */
  findById(id: number): Promise<SubscriptionEvent | null>;

  /**
   * Busca todos los eventos de una suscripción
   */
  findBySubscriptionId(
    subscriptionId: number,
    skip?: number,
    take?: number,
  ): Promise<SubscriptionEvent[]>;

  /**
   * Busca eventos por tipo
   */
  findByType(subscriptionId: number, type: SubscriptionEvent['type']): Promise<SubscriptionEvent[]>;

  /**
   * Guarda un nuevo evento
   */
  save(event: SubscriptionEvent): Promise<SubscriptionEvent>;
}
