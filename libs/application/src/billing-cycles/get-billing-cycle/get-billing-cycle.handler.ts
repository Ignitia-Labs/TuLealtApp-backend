import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBillingCycleRepository } from '@libs/domain';
import { GetBillingCycleRequest } from './get-billing-cycle.request';
import { GetBillingCycleResponse } from './get-billing-cycle.response';

/**
 * Handler para el caso de uso de obtener un ciclo de facturación por ID
 */
@Injectable()
export class GetBillingCycleHandler {
  constructor(
    @Inject('IBillingCycleRepository')
    private readonly billingCycleRepository: IBillingCycleRepository,
  ) {}

  async execute(request: GetBillingCycleRequest): Promise<GetBillingCycleResponse> {
    const billingCycle = await this.billingCycleRepository.findById(request.billingCycleId);

    if (!billingCycle) {
      throw new NotFoundException(`Billing cycle with ID ${request.billingCycleId} not found`);
    }

    return new GetBillingCycleResponse(
      billingCycle.id,
      billingCycle.subscriptionId,
      billingCycle.partnerId,
      billingCycle.cycleNumber,
      billingCycle.startDate,
      billingCycle.endDate,
      billingCycle.durationDays,
      billingCycle.billingDate,
      billingCycle.dueDate,
      billingCycle.amount,
      billingCycle.paidAmount,
      billingCycle.totalAmount,
      billingCycle.currency,
      billingCycle.status,
      billingCycle.paymentStatus,
      billingCycle.paymentDate,
      billingCycle.paymentMethod,
      billingCycle.invoiceId,
      billingCycle.invoiceNumber,
      billingCycle.invoiceStatus,
      billingCycle.discountApplied,
      billingCycle.createdAt,
      billingCycle.updatedAt,
    );
  }
}

