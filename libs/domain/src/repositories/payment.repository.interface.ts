import { Payment } from '../entities/payment.entity';

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
  findByPartnerId(partnerId: number, skip?: number, take?: number): Promise<Payment[]>;

  /**
   * Busca pagos por factura
   */
  findByInvoiceId(invoiceId: number): Promise<Payment[]>;

  /**
   * Busca pagos por estado
   */
  findByStatus(
    partnerId: number,
    status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled',
  ): Promise<Payment[]>;

  /**
   * Guarda un nuevo pago
   */
  save(payment: Payment): Promise<Payment>;

  /**
   * Actualiza un pago existente
   */
  update(payment: Payment): Promise<Payment>;
}
