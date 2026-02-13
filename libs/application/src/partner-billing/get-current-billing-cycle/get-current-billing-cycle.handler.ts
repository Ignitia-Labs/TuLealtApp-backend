import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBillingCycleRepository, ICurrencyRepository } from '@libs/domain';
import { GetCurrentBillingCycleRequest } from './get-current-billing-cycle.request';
import { GetCurrentBillingCycleResponse } from './get-current-billing-cycle.response';

/**
 * Handler para obtener el ciclo de facturación actual del partner
 * Retorna el ciclo más reciente que esté activo o pendiente de pago
 */
@Injectable()
export class GetCurrentBillingCycleHandler {
  constructor(
    @Inject('IBillingCycleRepository')
    private readonly billingCycleRepository: IBillingCycleRepository,
    @Inject('ICurrencyRepository')
    private readonly currencyRepository: ICurrencyRepository,
  ) {}

  async execute(request: GetCurrentBillingCycleRequest): Promise<GetCurrentBillingCycleResponse> {
    // Buscar el ciclo de facturación actual del partner
    // El ciclo actual es el más reciente que cumple:
    // - Está dentro del período actual (endDate >= NOW)
    // - O tiene estado pending/overdue (aún no pagado)
    const billingCycles = await this.billingCycleRepository.findByPartnerId(request.partnerId);

    if (!billingCycles || billingCycles.length === 0) {
      throw new NotFoundException(`No billing cycles found for partner ${request.partnerId}`);
    }

    const now = new Date();

    // Filtrar ciclos actuales o pendientes
    const currentCycle = billingCycles
      .filter((cycle) => {
        const isCurrentPeriod = cycle.endDate >= now;
        const isPendingOrOverdue = cycle.status === 'pending' || cycle.status === 'overdue';
        return isCurrentPeriod || isPendingOrOverdue;
      })
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0]; // Más reciente primero

    if (!currentCycle) {
      throw new NotFoundException(
        `No current or pending billing cycle found for partner ${request.partnerId}`,
      );
    }

    // Obtener información de la moneda
    const currency = await this.currencyRepository.findByCode(currentCycle.currency);
    const currencyId = currency?.id ?? null;
    const currencyLabel = currency?.name ?? null;

    // Calcular días hasta vencimiento
    const daysUntilDue = Math.ceil(
      (currentCycle.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Verificar si está vencido
    const isOverdue = currentCycle.isOverdue();

    return new GetCurrentBillingCycleResponse(
      currentCycle.id,
      currentCycle.subscriptionId,
      currentCycle.partnerId,
      currentCycle.cycleNumber,
      currentCycle.startDate,
      currentCycle.endDate,
      currentCycle.durationDays,
      currentCycle.billingDate,
      currentCycle.dueDate,
      currentCycle.amount,
      currentCycle.paidAmount,
      currentCycle.totalAmount,
      currentCycle.currency,
      currencyId,
      currencyLabel,
      currentCycle.status,
      currentCycle.paymentStatus,
      currentCycle.invoiceNumber,
      daysUntilDue,
      isOverdue,
      currentCycle.discountApplied,
    );
  }
}
