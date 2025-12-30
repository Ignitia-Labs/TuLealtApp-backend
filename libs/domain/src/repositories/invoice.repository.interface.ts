import { Invoice } from '../entities/invoice.entity';

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
  findByPartnerId(partnerId: number, skip?: number, take?: number): Promise<Invoice[]>;

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
