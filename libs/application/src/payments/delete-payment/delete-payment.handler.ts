import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IPaymentRepository,
  IBillingCycleRepository,
  IInvoiceRepository,
  ISubscriptionEventRepository,
  Payment,
} from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper } from '@libs/infrastructure';
import { registerSubscriptionEvent } from '@libs/shared';
import { DeletePaymentRequest } from './delete-payment.request';
import { DeletePaymentResponse } from './delete-payment.response';

/**
 * Handler para el caso de uso de eliminar un pago
 * Solo disponible para administradores
 *
 * Nota: Al eliminar un pago, se debe revertir su impacto en:
 * - Billing cycles (reducir paidAmount)
 * - Invoices (revertir estado de pago si aplica)
 * - Subscriptions (revertir crédito si aplica)
 * - Si es un payment original, también elimina todos sus payments derivados
 */
@Injectable()
export class DeletePaymentHandler {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IBillingCycleRepository')
    private readonly billingCycleRepository: IBillingCycleRepository,
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('ISubscriptionEventRepository')
    private readonly subscriptionEventRepository: ISubscriptionEventRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(request: DeletePaymentRequest): Promise<DeletePaymentResponse> {
    const payment = await this.paymentRepository.findById(request.paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${request.paymentId} not found`);
    }

    // Si es un payment original (no tiene originalPaymentId), buscar y eliminar sus derivados primero
    const isOriginalPayment = !payment.originalPaymentId || payment.originalPaymentId === 0;

    if (isOriginalPayment) {
      // Buscar todos los payments derivados asociados a este payment original
      const derivedPayments = await this.paymentRepository.findDerivedByOriginalPaymentId(payment.id);

      // Eliminar cada payment derivado, revirtiendo sus impactos
      for (const derivedPayment of derivedPayments) {
        await this.revertPaymentImpact(derivedPayment);
        await this.paymentRepository.delete(derivedPayment.id);
      }
    }

    // Revertir el impacto del payment original (o del derivado si es que se está eliminando directamente)
    await this.revertPaymentImpact(payment);

    // Obtener la suscripción para registrar el evento antes de eliminar
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { id: payment.subscriptionId },
    });

    // Eliminar el pago
    await this.paymentRepository.delete(request.paymentId);

    // Registrar evento de suscripción para pago eliminado
    if (subscriptionEntity) {
      try {
        const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);
        await registerSubscriptionEvent(
          {
            type: 'custom',
            subscription,
            paymentId: payment.id,
            invoiceId: payment.invoiceId,
            title: 'Pago eliminado',
            description: `Se eliminó el pago ${payment.id} de ${payment.amount} ${payment.currency}. Método: ${payment.paymentMethod}`,
            metadata: {
              amount: payment.amount,
              currency: payment.currency,
              paymentMethod: payment.paymentMethod,
              transactionId: payment.transactionId,
              status: payment.status,
            },
          },
          this.subscriptionEventRepository,
        );
      } catch (error) {
        // Log error pero no fallar el proceso de eliminación
        console.error('Error registering subscription event for deleted payment:', error);
      }
    }

    return new DeletePaymentResponse(
      request.paymentId,
      'Payment deleted successfully',
    );
  }

  /**
   * Método auxiliar para revertir el impacto de un payment en billing cycles e invoices
   */
  private async revertPaymentImpact(payment: Payment): Promise<void> {
    // Si el pago está asociado a un billing cycle, revertir el impacto
    if (payment.billingCycleId) {
      const billingCycle = await this.billingCycleRepository.findById(payment.billingCycleId);
      if (billingCycle) {
        // Revertir el pago del ciclo
        const updatedCycle = billingCycle.reversePayment(payment.amount);
        await this.billingCycleRepository.update(updatedCycle);
      }
    }

    // Si el pago está asociado a una factura, verificar si hay otros pagos antes de revertir
    if (payment.invoiceId) {
      const invoice = await this.invoiceRepository.findById(payment.invoiceId);
      if (invoice) {
        // Buscar otros pagos asociados a esta factura
        const otherPayments = await this.paymentRepository.findByInvoiceId(payment.invoiceId);
        const hasOtherPayments = otherPayments.some(p => p.id !== payment.id && p.status === 'paid');

        // Solo revertir el estado si no hay otros pagos pagados
        if (!hasOtherPayments && invoice.status === 'paid') {
          const updatedInvoice = invoice.reversePayment(payment.amount);
          await this.invoiceRepository.update(updatedInvoice);
        }
      }
    }
  }
}

