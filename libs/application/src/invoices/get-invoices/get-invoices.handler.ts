import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IInvoiceRepository } from '@libs/domain';
import { GetInvoicesRequest } from './get-invoices.request';
import { GetInvoicesResponse } from './get-invoices.response';
import { GetInvoiceResponse } from '../get-invoice/get-invoice.response';
import { InvoiceItemResponse } from '../create-invoice/create-invoice.response';

/**
 * Handler para el caso de uso de obtener múltiples facturas
 */
@Injectable()
export class GetInvoicesHandler {
  constructor(
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
  ) {}

  async execute(request: GetInvoicesRequest): Promise<GetInvoicesResponse> {
    if (!request.subscriptionId && !request.partnerId) {
      throw new BadRequestException('Either subscriptionId or partnerId must be provided');
    }

    let invoices;
    const skip = request.page && request.limit ? (request.page - 1) * request.limit : undefined;
    const take = request.limit;

    if (request.subscriptionId) {
      invoices = await this.invoiceRepository.findBySubscriptionId(request.subscriptionId);
    } else if (request.partnerId) {
      invoices = await this.invoiceRepository.findByPartnerId(
        request.partnerId,
        undefined, // status
        skip ? skip + 1 : 1, // page
        take, // limit
      );
      // Ordenar por fecha de vencimiento (más antigua primero) para facturas pendientes
      invoices.sort((a, b) => {
        // Primero las pendientes ordenadas por dueDate ASC
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        if (a.status === 'pending' && b.status === 'pending') {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        // Para las demás, mantener orden por issueDate DESC
        return b.issueDate.getTime() - a.issueDate.getTime();
      });
    }

    const invoiceDtos: GetInvoiceResponse[] = invoices.map((invoice) => {
      const items: InvoiceItemResponse[] = invoice.items.map(
        (item) =>
          new InvoiceItemResponse(
            item.id,
            item.description,
            item.quantity,
            item.unitPrice,
            item.amount,
            item.taxRate,
            item.taxAmount,
            item.discountPercent,
            item.discountAmount,
            item.total,
          ),
      );

      // Calcular días hasta vencimiento e isOverdue
      let daysUntilDue: number | null = null;
      let isOverdue = false;
      if (invoice.status === 'pending' || invoice.status === 'overdue') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(invoice.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffTime = due.getTime() - today.getTime();
        daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isOverdue = daysUntilDue < 0;
      }

      return new GetInvoiceResponse(
        invoice.id,
        invoice.invoiceNumber,
        invoice.subscriptionId,
        invoice.partnerId,
        invoice.billingCycleId,
        invoice.businessName,
        invoice.taxId,
        invoice.fiscalAddress,
        invoice.billingEmail,
        invoice.issueDate,
        invoice.dueDate,
        invoice.paidDate,
        invoice.subtotal,
        invoice.discountAmount,
        invoice.taxAmount,
        invoice.creditApplied,
        invoice.total,
        invoice.currency,
        items,
        invoice.status,
        invoice.paymentStatus,
        invoice.paymentMethod,
        invoice.pdfUrl,
        invoice.notes,
        invoice.createdAt,
        invoice.updatedAt,
        daysUntilDue,
        isOverdue,
      );
    });

    return new GetInvoicesResponse(
      invoiceDtos,
      invoiceDtos.length,
      request.page || null,
      request.limit || null,
    );
  }
}
