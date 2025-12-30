import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IInvoiceRepository, ISubscriptionEventRepository } from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper } from '@libs/infrastructure';
import { registerSubscriptionEvent } from '@libs/shared';
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
    @Inject('ISubscriptionEventRepository')
    private readonly subscriptionEventRepository: ISubscriptionEventRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(request: DeleteInvoiceRequest): Promise<DeleteInvoiceResponse> {
    const invoice = await this.invoiceRepository.findById(request.invoiceId);

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${request.invoiceId} not found`);
    }

    // Obtener la suscripción para registrar el evento antes de eliminar
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { id: invoice.subscriptionId },
    });

    await this.invoiceRepository.delete(request.invoiceId);

    // Registrar evento de suscripción para factura eliminada
    if (subscriptionEntity) {
      try {
        const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);
        await registerSubscriptionEvent(
          {
            type: 'custom',
            subscription,
            invoiceId: invoice.id,
            title: 'Factura eliminada',
            description: `Se eliminó la factura ${invoice.invoiceNumber} por un monto de ${invoice.total} ${invoice.currency}`,
            metadata: {
              invoiceNumber: invoice.invoiceNumber,
              total: invoice.total,
              subtotal: invoice.subtotal,
              taxAmount: invoice.taxAmount,
              currency: invoice.currency,
              status: invoice.status,
              paymentStatus: invoice.paymentStatus,
            },
          },
          this.subscriptionEventRepository,
        );
      } catch (error) {
        // Log error pero no fallar el proceso de eliminación
        console.error('Error registering subscription event for deleted invoice:', error);
      }
    }

    return new DeleteInvoiceResponse(
      request.invoiceId,
      'Invoice deleted successfully',
    );
  }
}

