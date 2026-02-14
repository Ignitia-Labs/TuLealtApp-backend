import { Payment } from '@libs/domain/entities/billing/payment.entity';

/**
 * Interfaz del repositorio de Payment
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IPaymentRepository {
  /**
   * Busca un pago por su ID
   */
  findById(id: number): Promise<Payment | null>;

  /**
   * Busca todos los pagos de una suscripción
   */
  findBySubscriptionId(subscriptionId: number): Promise<Payment[]>;

  /**
   * Busca todos los pagos de un partner
   */
  findByPartnerId(
    partnerId: number,
    status?:
      | 'pending'
      | 'pending_validation'
      | 'validated'
      | 'rejected'
      | 'paid'
      | 'failed'
      | 'refunded'
      | 'cancelled',
    page?: number | null,
    limit?: number | null,
    includeDerived?: boolean,
  ): Promise<Payment[]>;

  /**
   * Cuenta todos los pagos de un partner con filtros opcionales
   */
  countByPartnerId(
    partnerId: number,
    status?:
      | 'pending'
      | 'pending_validation'
      | 'validated'
      | 'rejected'
      | 'paid'
      | 'failed'
      | 'refunded'
      | 'cancelled',
  ): Promise<number>;

  /**
   * Busca pagos por factura
   */
  findByInvoiceId(invoiceId: number): Promise<Payment[]>;

  /**
   * Busca pagos por estado
   */
  findByStatus(
    partnerId: number,
    status:
      | 'pending'
      | 'pending_validation'
      | 'validated'
      | 'rejected'
      | 'paid'
      | 'failed'
      | 'refunded'
      | 'cancelled',
  ): Promise<Payment[]>;

  /**
   * Guarda un nuevo pago
   */
  save(payment: Payment): Promise<Payment>;

  /**
   * Actualiza un pago existente
   */
  update(payment: Payment): Promise<Payment>;

  /**
   * Busca pagos sin billingCycleId asignado de una suscripción
   */
  findUnassignedBySubscriptionId(subscriptionId: number, currency?: string): Promise<Payment[]>;

  /**
   * Busca pagos asociados a un billing cycle
   */
  findByBillingCycleId(billingCycleId: number): Promise<Payment[]>;

  /**
   * Busca un pago por transactionId
   */
  findByTransactionId(transactionId: number): Promise<Payment | null>;

  /**
   * Obtiene el siguiente transactionId disponible (máximo + 1)
   */
  getNextTransactionId(): Promise<number>;

  /**
   * Elimina un pago por ID
   */
  delete(id: number): Promise<void>;

  /**
   * Busca todos los payments derivados de un payment original
   */
  findDerivedByOriginalPaymentId(originalPaymentId: number): Promise<Payment[]>;

  /**
   * Busca un pago por su número de referencia
   */
  findByReference(reference: string): Promise<Payment | null>;

  /**
   * Busca payments pendientes de validación de un partner
   */
  findPendingValidationByPartnerId(partnerId: number): Promise<Payment[]>;

  /**
   * Busca payments rechazados de un partner
   */
  findRejectedByPartnerId(partnerId: number): Promise<Payment[]>;
}
