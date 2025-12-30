import { Invoice, InvoiceItem } from '@libs/domain';
import { InvoiceEntity } from '../entities/invoice.entity';
import { InvoiceItemEntity } from '../entities/invoice-item.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class InvoiceMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: InvoiceEntity): Invoice {
    const items: InvoiceItem[] =
      persistenceEntity.items && persistenceEntity.items.length > 0
        ? persistenceEntity.items.map((item) => ({
            id: item.itemId,
            description: item.description,
            quantity: Number(item.quantity), // Convertir DECIMAL a número
            unitPrice: Number(item.unitPrice), // Convertir DECIMAL a número
            amount: Number(item.amount), // Convertir DECIMAL a número
            taxRate: Number(item.taxRate), // Convertir DECIMAL a número
            taxAmount: Number(item.taxAmount), // Convertir DECIMAL a número
            discountPercent: item.discountPercent ? Number(item.discountPercent) : undefined,
            discountAmount: item.discountAmount ? Number(item.discountAmount) : undefined,
            total: Number(item.total), // Convertir DECIMAL a número
          }))
        : [];

    return new Invoice(
      persistenceEntity.id,
      persistenceEntity.invoiceNumber,
      persistenceEntity.subscriptionId,
      persistenceEntity.partnerId,
      persistenceEntity.billingCycleId,
      persistenceEntity.businessName,
      persistenceEntity.taxId,
      persistenceEntity.fiscalAddress,
      persistenceEntity.billingEmail,
      persistenceEntity.issueDate,
      persistenceEntity.dueDate,
      persistenceEntity.paidDate,
      Number(persistenceEntity.subtotal), // Convertir DECIMAL a número
      persistenceEntity.discountAmount ? Number(persistenceEntity.discountAmount) : undefined,
      Number(persistenceEntity.taxAmount), // Convertir DECIMAL a número
      persistenceEntity.creditApplied ? Number(persistenceEntity.creditApplied) : undefined,
      Number(persistenceEntity.total), // Convertir DECIMAL a número
      persistenceEntity.currency,
      items,
      persistenceEntity.status,
      persistenceEntity.paymentStatus,
      persistenceEntity.paymentMethod,
      persistenceEntity.pdfUrl,
      persistenceEntity.notes,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Invoice): InvoiceEntity {
    const entity = new InvoiceEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.invoiceNumber = domainEntity.invoiceNumber;
    entity.subscriptionId = domainEntity.subscriptionId;
    entity.partnerId = domainEntity.partnerId;
    entity.billingCycleId = domainEntity.billingCycleId;
    entity.businessName = domainEntity.businessName;
    entity.taxId = domainEntity.taxId;
    entity.fiscalAddress = domainEntity.fiscalAddress;
    entity.billingEmail = domainEntity.billingEmail;
    entity.issueDate = domainEntity.issueDate;
    entity.dueDate = domainEntity.dueDate;
    entity.paidDate = domainEntity.paidDate;
    entity.subtotal = domainEntity.subtotal;
    entity.discountAmount = domainEntity.discountAmount;
    entity.taxAmount = domainEntity.taxAmount;
    entity.creditApplied = domainEntity.creditApplied;
    entity.total = domainEntity.total;
    entity.currency = domainEntity.currency;
    entity.status = domainEntity.status;
    entity.paymentStatus = domainEntity.paymentStatus;
    entity.paymentMethod = domainEntity.paymentMethod;
    entity.pdfUrl = domainEntity.pdfUrl;
    entity.notes = domainEntity.notes;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;

    // Convertir items
    entity.items =
      domainEntity.items && domainEntity.items.length > 0
        ? domainEntity.items.map((item) => {
            const itemEntity = new InvoiceItemEntity();
            // Asignar invoiceId si la factura ya tiene ID (para updates)
            if (domainEntity.id > 0) {
              itemEntity.invoiceId = domainEntity.id;
            }
            itemEntity.itemId = item.id;
            itemEntity.description = item.description;
            itemEntity.quantity = item.quantity;
            itemEntity.unitPrice = item.unitPrice;
            itemEntity.amount = item.amount;
            itemEntity.taxRate = item.taxRate;
            itemEntity.taxAmount = item.taxAmount;
            itemEntity.discountPercent = item.discountPercent ?? null;
            itemEntity.discountAmount = item.discountAmount ?? null;
            itemEntity.total = item.total;
            return itemEntity;
          })
        : [];

    return entity;
  }
}
