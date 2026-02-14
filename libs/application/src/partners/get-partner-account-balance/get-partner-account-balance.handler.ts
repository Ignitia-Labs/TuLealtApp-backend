import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IPartnerRepository,
  IPaymentRepository,
  IInvoiceRepository,
  IBillingCycleRepository,
} from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper } from '@libs/infrastructure';
import { GetPartnerAccountBalanceRequest } from './get-partner-account-balance.request';
import {
  GetPartnerAccountBalanceResponse,
  InvoiceSummary,
  PaymentSummary,
} from './get-partner-account-balance.response';

/**
 * Handler para el caso de uso de obtener el estado de cuenta del partner
 */
@Injectable()
export class GetPartnerAccountBalanceHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IBillingCycleRepository')
    private readonly billingCycleRepository: IBillingCycleRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(
    request: GetPartnerAccountBalanceRequest,
  ): Promise<GetPartnerAccountBalanceResponse> {
    // Validar que el partner existe
    const partner = await this.partnerRepository.findById(request.partnerId);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
    }

    // Obtener suscripción del partner
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { partnerId: request.partnerId },
      order: { createdAt: 'DESC' },
    });

    if (!subscriptionEntity) {
      throw new NotFoundException(`No subscription found for partner ${request.partnerId}`);
    }

    const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);

    // Obtener todos los pagos exitosos del partner (solo originales, no derivados)
    const allPayments = await this.paymentRepository.findByPartnerId(request.partnerId);
    // Filtrar solo payments originales (no derivados) para el cálculo de total pagado
    // Un payment es original si no tiene originalPaymentId o es 0
    const originalPayments = allPayments.filter(
      (p) =>
        (p.status === 'validated' || p.status === 'paid') &&
        (!p.originalPaymentId || p.originalPaymentId === 0),
    );
    // Asegurar conversión a número para evitar concatenación de strings
    const totalPaid = originalPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Obtener facturas pendientes del partner
    const pendingInvoices = await this.invoiceRepository.findPendingByPartnerId(request.partnerId);
    // Asegurar conversión a número para evitar concatenación de strings
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // Calcular crédito disponible dinámicamente basándose en pagos sin aplicar
    // El crédito es la suma de los montos restantes de los pagos originales que no se han aplicado completamente
    let calculatedCreditBalance = 0;
    for (const payment of originalPayments) {
      const derivedPayments = await this.paymentRepository.findDerivedByOriginalPaymentId(
        payment.id,
      );
      // Filtrar solo payments derivados que están realmente aplicados a un billing cycle o invoice válido
      const validDerivedPayments = derivedPayments.filter(
        (dp) => dp.billingCycleId !== null || dp.invoiceId !== null,
      );
      const appliedAmount = validDerivedPayments.reduce((sum, dp) => sum + Number(dp.amount), 0);
      const remainingAmount = Math.max(0, Number(payment.amount) - appliedAmount);
      calculatedCreditBalance += remainingAmount;
    }
    // Redondear a 2 decimales
    calculatedCreditBalance = Math.round(calculatedCreditBalance * 100) / 100;

    // Usar el crédito calculado dinámicamente en lugar del almacenado
    const creditBalance = calculatedCreditBalance;
    const outstandingBalance = Math.max(0, totalPending - creditBalance);
    const availableCredit = Math.max(0, creditBalance - totalPending);

    // Obtener últimas 10 facturas pendientes
    const invoiceSummaries: InvoiceSummary[] = pendingInvoices.slice(0, 10).map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      total: inv.total,
      dueDate: inv.dueDate,
      status: inv.status,
    }));

    // Ordenar pagos originales por fecha descendente (más reciente primero)
    const sortedOriginalPayments = [...originalPayments].sort(
      (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime(),
    );

    // Calcular dinámicamente el último pago desde los pagos existentes
    const lastPayment = sortedOriginalPayments.length > 0 ? sortedOriginalPayments[0] : null;
    const lastPaymentDate = lastPayment ? lastPayment.paymentDate : null;
    const lastPaymentAmount = lastPayment ? Number(lastPayment.amount) : null;

    // Calcular información de aplicaciones para los últimos 10 pagos originales
    const paymentSummaries: PaymentSummary[] = await Promise.all(
      sortedOriginalPayments.slice(0, 10).map(async (p) => {
        const derivedPayments = await this.paymentRepository.findDerivedByOriginalPaymentId(p.id);
        // Filtrar solo payments derivados que están realmente aplicados a un billing cycle o invoice válido
        const validDerivedPayments = derivedPayments.filter(
          (dp) => dp.billingCycleId !== null || dp.invoiceId !== null,
        );
        const appliedAmount = validDerivedPayments.reduce((sum, dp) => sum + Number(dp.amount), 0);
        const remainingAmount = Math.max(0, Number(p.amount) - appliedAmount);
        const isFullyApplied = remainingAmount <= 0.01; // Tolerancia para decimales

        return {
          id: p.id,
          amount: p.amount,
          paymentDate: p.paymentDate,
          status: p.status,
          originalPaymentId: p.originalPaymentId,
          isDerived: false,
          reference: p.reference,
          appliedAmount,
          remainingAmount,
          isFullyApplied,
        };
      }),
    );

    // NUEVO: Calcular pagos pendientes de validación
    const pendingValidationPayments = allPayments.filter(
      (p) => p.status === 'pending_validation' && (!p.originalPaymentId || p.originalPaymentId === 0),
    );
    const totalPendingValidation = pendingValidationPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    // NUEVO: Calcular pagos rechazados
    const rejectedPayments = allPayments.filter(
      (p) => p.status === 'rejected' && (!p.originalPaymentId || p.originalPaymentId === 0),
    );
    const totalRejected = rejectedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // NUEVO: Mapear pagos pendientes de validación
    const pendingValidationSummaries: PaymentSummary[] = pendingValidationPayments
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        amount: p.amount,
        paymentDate: p.paymentDate,
        status: p.status,
        originalPaymentId: p.originalPaymentId,
        isDerived: false,
        reference: p.reference,
      }));

    // NUEVO: Mapear pagos rechazados
    const rejectedPaymentSummaries: PaymentSummary[] = rejectedPayments.slice(0, 10).map((p) => ({
      id: p.id,
      amount: p.amount,
      paymentDate: p.paymentDate,
      status: p.status,
      originalPaymentId: p.originalPaymentId,
      isDerived: false,
      reference: p.reference,
    }));

    // NUEVO: Obtener billing cycles con pagos parciales
    const allCycles = await this.billingCycleRepository.findBySubscriptionId(subscription.id);
    const partiallyPaidCycles = allCycles
      .filter(
        (cycle) =>
          cycle.paidAmount > 0 &&
          cycle.paidAmount < cycle.totalAmount &&
          cycle.status !== 'paid',
      )
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5);

    const partiallyPaidCycleSummaries = await Promise.all(
      partiallyPaidCycles.map(async (cycle) => {
        const cyclePayments = await this.paymentRepository.findByBillingCycleId(cycle.id);
        const validatedCyclePayments = cyclePayments.filter(
          (p) => p.status === 'validated' || p.status === 'paid',
        );

        return {
          cycleId: cycle.id,
          cycleNumber: cycle.cycleNumber,
          totalAmount: cycle.totalAmount,
          paidAmount: cycle.paidAmount,
          remainingAmount: cycle.totalAmount - cycle.paidAmount,
          percentagePaid: Math.round((cycle.paidAmount / cycle.totalAmount) * 100),
          dueDate: cycle.dueDate,
          payments: validatedCyclePayments.map((p) => ({
            id: p.id,
            amount: p.amount,
            paymentDate: p.paymentDate,
            reference: p.reference,
          })),
        };
      }),
    );

    return new GetPartnerAccountBalanceResponse(
      request.partnerId,
      totalPaid,
      totalPending,
      creditBalance,
      outstandingBalance,
      availableCredit,
      subscription.currency,
      lastPaymentDate,
      lastPaymentAmount,
      invoiceSummaries,
      paymentSummaries,
      totalPendingValidation,
      totalRejected,
      pendingValidationSummaries,
      rejectedPaymentSummaries,
      partiallyPaidCycleSummaries,
    );
  }
}
