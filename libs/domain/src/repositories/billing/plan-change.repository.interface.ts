import { PlanChange } from '@libs/domain/entities/billing/plan-change.entity';

/**
 * Interfaz del repositorio de PlanChange
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IPlanChangeRepository {
  /**
   * Busca un cambio de plan por su ID
   */
  findById(id: number): Promise<PlanChange | null>;

  /**
   * Busca todos los cambios de plan de una suscripción
   */
  findBySubscriptionId(subscriptionId: number): Promise<PlanChange[]>;

  /**
   * Busca cambios de plan pendientes
   */
  findPendingBySubscriptionId(subscriptionId: number): Promise<PlanChange[]>;

  /**
   * Guarda un nuevo cambio de plan
   */
  save(planChange: PlanChange): Promise<PlanChange>;

  /**
   * Actualiza un cambio de plan existente
   */
  update(planChange: PlanChange): Promise<PlanChange>;
}
