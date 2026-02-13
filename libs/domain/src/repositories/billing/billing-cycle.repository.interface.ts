import { BillingCycle } from '@libs/domain/entities/billing/billing-cycle.entity';

/**
 * Interfaz del repositorio de BillingCycle
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IBillingCycleRepository {
  /**
   * Busca un ciclo por su ID
   */
  findById(id: number): Promise<BillingCycle | null>;

  /**
   * Busca todos los ciclos de una suscripción
   */
  findBySubscriptionId(subscriptionId: number): Promise<BillingCycle[]>;

  /**
   * Busca ciclos pendientes de pago
   */
  findPendingByPartnerId(partnerId: number): Promise<BillingCycle[]>;

  /**
   * Busca todos los ciclos de un partner
   */
  findByPartnerId(partnerId: number): Promise<BillingCycle[]>;

  /**
   * Busca el ciclo actual de una suscripción
   */
  findCurrentBySubscriptionId(subscriptionId: number): Promise<BillingCycle | null>;

  /**
   * Guarda un nuevo ciclo
   */
  save(cycle: BillingCycle): Promise<BillingCycle>;

  /**
   * Actualiza un ciclo existente
   */
  update(cycle: BillingCycle): Promise<BillingCycle>;

  /**
   * Busca billing cycles pendientes de una suscripción
   */
  findPendingBySubscriptionId(subscriptionId: number): Promise<BillingCycle[]>;

  /**
   * Busca billing cycles que aún tienen saldo pendiente
   */
  findWithRemainingBalance(subscriptionId: number, currency?: string): Promise<BillingCycle[]>;

  /**
   * Elimina un ciclo de facturación
   */
  delete(id: number): Promise<void>;
}
