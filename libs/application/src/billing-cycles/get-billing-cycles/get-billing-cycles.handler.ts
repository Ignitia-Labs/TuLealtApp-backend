import { Injectable, Inject } from '@nestjs/common';
import { IBillingCycleRepository, ICurrencyRepository } from '@libs/domain';
import { GetBillingCyclesRequest } from './get-billing-cycles.request';
import { GetBillingCyclesResponse } from './get-billing-cycles.response';
import { GetBillingCycleResponse } from '../get-billing-cycle/get-billing-cycle.response';

/**
 * Handler para el caso de uso de obtener múltiples ciclos de facturación
 */
@Injectable()
export class GetBillingCyclesHandler {
  constructor(
    @Inject('IBillingCycleRepository')
    private readonly billingCycleRepository: IBillingCycleRepository,
    @Inject('ICurrencyRepository')
    private readonly currencyRepository: ICurrencyRepository,
  ) {}

  async execute(request: GetBillingCyclesRequest): Promise<GetBillingCyclesResponse> {
    let billingCycles;

    if (request.subscriptionId) {
      billingCycles = await this.billingCycleRepository.findBySubscriptionId(
        request.subscriptionId,
      );
    } else if (request.partnerId) {
      billingCycles = await this.billingCycleRepository.findPendingByPartnerId(request.partnerId);
    } else {
      // Si no se proporciona ningún filtro, retornar array vacío
      // En un caso real, podrías querer lanzar un error o retornar todos
      billingCycles = [];
    }

    // Obtener todas las monedas únicas para evitar múltiples consultas
    const uniqueCurrencyCodes = [...new Set(billingCycles.map((c) => c.currency))] as string[];
    const currencyMap = new Map<string, { id: number; name: string }>();

    await Promise.all(
      uniqueCurrencyCodes.map(async (code: string) => {
        const currency = await this.currencyRepository.findByCode(code);
        if (currency) {
          currencyMap.set(code, { id: currency.id, name: currency.name });
        }
      }),
    );

    const billingCycleDtos: GetBillingCycleResponse[] = billingCycles.map((cycle) => {
      const currencyInfo = currencyMap.get(cycle.currency);
      return new GetBillingCycleResponse(
        cycle.id,
        cycle.subscriptionId,
        cycle.partnerId,
        cycle.cycleNumber,
        cycle.startDate,
        cycle.endDate,
        cycle.durationDays,
        cycle.billingDate,
        cycle.dueDate,
        cycle.amount,
        cycle.paidAmount,
        cycle.totalAmount,
        cycle.currency,
        currencyInfo?.id ?? null,
        currencyInfo?.name ?? null,
        cycle.status,
        cycle.paymentStatus,
        cycle.paymentDate,
        cycle.paymentMethod,
        cycle.invoiceId,
        cycle.invoiceNumber,
        cycle.invoiceStatus,
        cycle.discountApplied,
        cycle.createdAt,
        cycle.updatedAt,
      );
    });

    return new GetBillingCyclesResponse(billingCycleDtos, billingCycleDtos.length);
  }
}
