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
      invoices = await this.invoiceRepository.findByPartnerId(request.partnerId, skip, take);
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
      );
    });

    return new GetInvoicesResponse(invoiceDtos, invoiceDtos.length, request.page || null, request.limit || null);
  }
}

