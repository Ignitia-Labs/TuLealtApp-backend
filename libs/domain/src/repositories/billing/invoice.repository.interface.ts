import { Invoice } from '@libs/domain/entities/billing/invoice.entity';

/**
 * Interfaz del repositorio de Invoice
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IInvoiceRepository {
  /**
   * Busca una factura por su ID
   */
  findById(id: number): Promise<Invoice | null>;

  /**
   * Busca una factura por su número
   */
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;

  /**
   * Busca todas las facturas de una suscripción
   */
  findBySubscriptionId(subscriptionId: number): Promise<Invoice[]>;

  /**
   * Busca todas las facturas de un partner
   */
  findByPartnerId(
    partnerId: number,
    status?: 'pending' | 'paid' | 'overdue' | 'cancelled',
    page?: number | null,
    limit?: number | null,
  ): Promise<Invoice[]>;

  /**
   * Cuenta todas las facturas de un partner con filtros opcionales
   */
  countByPartnerId(
    partnerId: number,
    status?: 'pending' | 'paid' | 'overdue' | 'cancelled',
  ): Promise<number>;

  /**
   * Busca facturas pendientes de pago
   */
  findPendingByPartnerId(partnerId: number): Promise<Invoice[]>;

  /**
   * Busca una factura por billingCycleId
   */
  findByBillingCycleId(billingCycleId: number): Promise<Invoice | null>;

  /**
   * Guarda una nueva factura
   */
  save(invoice: Invoice): Promise<Invoice>;

  /**
   * Actualiza una factura existente
   */
  update(invoice: Invoice): Promise<Invoice>;

  /**
   * Elimina una factura
   */
  delete(id: number): Promise<void>;
}
