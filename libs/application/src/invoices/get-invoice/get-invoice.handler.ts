import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IInvoiceRepository } from '@libs/domain';
import { GetInvoiceRequest } from './get-invoice.request';
import { GetInvoiceResponse } from './get-invoice.response';
import { InvoiceItemResponse } from '../create-invoice/create-invoice.response';

/**
 * Handler para el caso de uso de obtener una factura por ID o número de factura
 */
@Injectable()
export class GetInvoiceHandler {
  constructor(
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
  ) {}

  async execute(request: GetInvoiceRequest): Promise<GetInvoiceResponse> {
    if (!request.invoiceId && !request.invoiceNumber) {
      throw new BadRequestException('Either invoiceId or invoiceNumber must be provided');
    }

    let invoice;

    if (request.invoiceId) {
      invoice = await this.invoiceRepository.findById(request.invoiceId);
    } else if (request.invoiceNumber) {
      invoice = await this.invoiceRepository.findByInvoiceNumber(request.invoiceNumber);
    }

    if (!invoice) {
      const identifier = request.invoiceId
        ? `ID ${request.invoiceId}`
        : `number ${request.invoiceNumber}`;
      throw new NotFoundException(`Invoice with ${identifier} not found`);
    }

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
  }
}

