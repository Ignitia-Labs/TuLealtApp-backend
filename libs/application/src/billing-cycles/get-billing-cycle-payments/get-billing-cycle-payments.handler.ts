import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBillingCycleRepository, IPaymentRepository } from '@libs/domain';
import { GetBillingCyclePaymentsRequest } from './get-billing-cycle-payments.request';
import {
  GetBillingCyclePaymentsResponse,
  BillingCyclePaymentDto,
} from './get-billing-cycle-payments.response';

/**
 * Handler para el caso de uso de obtener payments de un billing cycle
 */
@Injectable()
export class GetBillingCyclePaymentsHandler {
  constructor(
    @Inject('IBillingCycleRepository')
    private readonly billingCycleRepository: IBillingCycleRepository,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(request: GetBillingCyclePaymentsRequest): Promise<GetBillingCyclePaymentsResponse> {
    // Obtener el billing cycle
    const billingCycle = await this.billingCycleRepository.findById(request.billingCycleId);

    if (!billingCycle) {
      throw new NotFoundException(`Billing cycle with ID ${request.billingCycleId} not found`);
    }

    // Obtener todos los payments aplicados a este billing cycle
    const payments = await this.paymentRepository.findByBillingCycleId(request.billingCycleId);

    // Convertir a DTOs
    const paymentDtos: BillingCyclePaymentDto[] = payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      originalPaymentId: payment.originalPaymentId,
      isDerived: payment.originalPaymentId !== null && payment.originalPaymentId > 0,
      reference: payment.reference,
      notes: payment.notes,
      createdAt: payment.createdAt,
    }));

    // Calcular monto restante
    const remainingAmount = Math.max(0, billingCycle.totalAmount - billingCycle.paidAmount);

    return new GetBillingCyclePaymentsResponse(
      billingCycle.id,
      billingCycle.cycleNumber,
      billingCycle.totalAmount,
      billingCycle.paidAmount,
      remainingAmount,
      billingCycle.currency,
      paymentDtos,
    );
  }
}
