import { SubscriptionAlert } from '@libs/domain/entities/billing/subscription-alert.entity';

/**
 * Interfaz del repositorio de SubscriptionAlert
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface ISubscriptionAlertRepository {
  /**
   * Busca una alerta por su ID
   */
  findById(id: number): Promise<SubscriptionAlert | null>;

  /**
   * Busca todas las alertas de una suscripción
   */
  findBySubscriptionId(subscriptionId: number): Promise<SubscriptionAlert[]>;

  /**
   * Busca alertas activas de una suscripción
   */
  findActiveBySubscriptionId(subscriptionId: number): Promise<SubscriptionAlert[]>;

  /**
   * Busca alertas por severidad
   */
  findBySeverity(
    subscriptionId: number,
    severity: 'info' | 'warning' | 'critical',
  ): Promise<SubscriptionAlert[]>;

  /**
   * Guarda una nueva alerta
   */
  save(alert: SubscriptionAlert): Promise<SubscriptionAlert>;

  /**
   * Actualiza una alerta existente
   */
  update(alert: SubscriptionAlert): Promise<SubscriptionAlert>;
}
