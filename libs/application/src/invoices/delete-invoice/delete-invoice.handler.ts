import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInvoiceRepository } from '@libs/domain';
import { DeleteInvoiceRequest } from './delete-invoice.request';
import { DeleteInvoiceResponse } from './delete-invoice.response';

/**
 * Handler para el caso de uso de eliminar una factura
 */
@Injectable()
export class DeleteInvoiceHandler {
  constructor(
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
  ) {}

  async execute(request: DeleteInvoiceRequest): Promise<DeleteInvoiceResponse> {
    const invoice = await this.invoiceRepository.findById(request.invoiceId);

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${request.invoiceId} not found`);
    }

    await this.invoiceRepository.delete(request.invoiceId);

    return new DeleteInvoiceResponse(
      request.invoiceId,
      'Invoice deleted successfully',
    );
  }
}

