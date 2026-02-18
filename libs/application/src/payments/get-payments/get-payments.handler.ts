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
        payments = await this.paymentRepository.findByPartnerId(
          request.partnerId,
          undefined, // status
          skip ? skip + 1 : 1, // page
          take, // limit
        );
      }
    } else {
      throw new BadRequestException(
        'At least one filter (subscriptionId, partnerId, or invoiceId) must be provided',
      );
    }

    // Filtrar payments derivados si no se solicita incluirlos
    let filteredPayments = payments;
    if (request.includeDerived !== true) {
      filteredPayments = payments.filter((p) => !p.originalPaymentId || p.originalPaymentId === 0);
    }

    // Para cada payment original, calcular información de aplicaciones
    const paymentDtos: GetPaymentResponse[] = await Promise.all(
      filteredPayments.map(async (payment) => {
        // Si es un payment derivado, no calcular aplicaciones
        if (payment.originalPaymentId && payment.originalPaymentId > 0) {
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
            payment.image,
            payment.originalPaymentId,
            payment.createdAt,
            payment.updatedAt,
          );
        }

        // Para payments originales, buscar derivados y calcular aplicaciones
        const derivedPayments = await this.paymentRepository.findDerivedByOriginalPaymentId(
          payment.id,
        );

        // Filtrar solo payments derivados que están realmente aplicados a un billing cycle o invoice válido
        // Los payments derivados con billingCycleId e invoiceId en null son "huérfanos" y no deberían contar
        const validDerivedPayments = derivedPayments.filter(
          (p) => p.billingCycleId !== null || p.invoiceId !== null,
        );

        // Convertir amounts a Number para evitar concatenación de strings
        const appliedAmount = validDerivedPayments.reduce((sum, p) => {
          const amount = Number(p.amount);
          if (isNaN(amount)) {
            console.warn(`Payment derivado ${p.id} tiene amount inválido: ${p.amount}`);
            return sum;
          }
          return sum + amount;
        }, 0);
        const paymentAmount = Number(payment.amount);
        const remainingAmount = Math.max(
          0,
          isNaN(paymentAmount) ? 0 : paymentAmount - appliedAmount,
        );
        const isFullyApplied = remainingAmount <= 0.01; // Tolerancia para decimales

        const applications = validDerivedPayments.map((p) => ({
          id: p.id,
          amount: p.amount,
          billingCycleId: p.billingCycleId,
          invoiceId: p.invoiceId,
          createdAt: p.createdAt,
        }));

        // Generar resumen simplificado para UI
        let summary;
        if (applications.length > 0) {
          const appliedTo = applications.map((app) => ({
            type: (app.billingCycleId ? 'billing_cycle' : 'invoice') as 'billing_cycle' | 'invoice',
            id: app.billingCycleId || app.invoiceId || 0,
            amount: app.amount,
          }));

          summary = {
            totalAmount: isNaN(paymentAmount) ? 0 : paymentAmount,
            appliedAmount: appliedAmount,
            remainingAmount: remainingAmount,
            isFullyApplied: isFullyApplied,
            applicationsCount: applications.length,
            appliedTo,
          };
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
          payment.image,
          payment.originalPaymentId,
          payment.createdAt,
          payment.updatedAt,
          appliedAmount,
          remainingAmount,
          isFullyApplied,
          applications,
          summary,
        );
      }),
    );

    return new GetPaymentsResponse(
      paymentDtos,
      paymentDtos.length,
      request.page || null,
      request.limit || null,
    );
  }
}
