import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPaymentRepository } from '@libs/domain';
import { GetPaymentRequest } from './get-payment.request';
import { GetPaymentResponse } from './get-payment.response';

/**
 * Handler para el caso de uso de obtener un pago por ID
 */
@Injectable()
export class GetPaymentHandler {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(request: GetPaymentRequest): Promise<GetPaymentResponse> {
    const payment = await this.paymentRepository.findById(request.paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${request.paymentId} not found`);
    }

    return new GetPaymentResponse(
      payment.id,
      payment.subscriptionId,
      payment.partnerId,
      payment.invoiceId,
      payment.billingCycleId,
      payment.amount,
      payment.currency,
      payment.paymentMethod,
      payment.status,
      payment.paymentDate,
      payment.processedDate,
      payment.transactionId,
      payment.reference,
      payment.confirmationCode,
      payment.gateway,
      payment.gatewayTransactionId,
      payment.cardLastFour,
      payment.cardBrand,
      payment.cardExpiry,
      payment.isRetry,
      payment.retryAttempt,
      payment.notes,
      payment.processedBy,
      payment.createdAt,
      payment.updatedAt,
    );
  }
}

