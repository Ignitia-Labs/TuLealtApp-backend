import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IPaymentRepository } from '@libs/domain';
import { GetPaymentsRequest } from './get-payments.request';
import { GetPaymentsResponse } from './get-payments.response';
import { GetPaymentResponse } from '../get-payment/get-payment.response';

/**
 * Handler para el caso de uso de obtener múltiples pagos
 */
@Injectable()
export class GetPaymentsHandler {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(request: GetPaymentsRequest): Promise<GetPaymentsResponse> {
    let payments;
    const skip = request.page && request.limit ? (request.page - 1) * request.limit : undefined;
    const take = request.limit;

    if (request.invoiceId) {
      payments = await this.paymentRepository.findByInvoiceId(request.invoiceId);
    } else if (request.subscriptionId) {
      payments = await this.paymentRepository.findBySubscriptionId(request.subscriptionId);
    } else if (request.partnerId) {
      if (request.status) {
        payments = await this.paymentRepository.findByStatus(request.partnerId, request.status);
      } else {
        payments = await this.paymentRepository.findByPartnerId(request.partnerId, skip, take);
      }
    } else {
      throw new BadRequestException(
        'At least one filter (subscriptionId, partnerId, or invoiceId) must be provided',
      );
    }

    const paymentDtos: GetPaymentResponse[] = payments.map(
      (payment) =>
        new GetPaymentResponse(
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
        ),
    );

    return new GetPaymentsResponse(paymentDtos, paymentDtos.length, request.page || null, request.limit || null);
  }
}

