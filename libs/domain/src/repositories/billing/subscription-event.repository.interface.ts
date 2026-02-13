import {
  SubscriptionEvent,
  SubscriptionEventType,
} from '@libs/domain/entities/billing/subscription-event.entity';

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
   * Busca eventos por rango de fechas con filtros opcionales
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: {
      subscriptionId?: number;
      partnerId?: number;
      type?: SubscriptionEventType;
    },
    skip?: number,
    take?: number,
  ): Promise<SubscriptionEvent[]>;

  /**
   * Cuenta eventos por rango de fechas con filtros opcionales
   */
  countByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: {
      subscriptionId?: number;
      partnerId?: number;
      type?: SubscriptionEventType;
    },
  ): Promise<number>;

  /**
   * Guarda un nuevo evento
   */
  save(event: SubscriptionEvent): Promise<SubscriptionEvent>;
}
