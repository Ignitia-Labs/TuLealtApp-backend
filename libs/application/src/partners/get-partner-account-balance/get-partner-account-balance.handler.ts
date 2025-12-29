import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IPartnerRepository,
  IPaymentRepository,
  IInvoiceRepository,
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
      throw new NotFoundException(
        `No subscription found for partner ${request.partnerId}`,
      );
    }

    const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);

    // Obtener todos los pagos exitosos del partner
    const allPayments = await this.paymentRepository.findByPartnerId(request.partnerId);
    const paidPayments = allPayments.filter((p) => p.status === 'paid');
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    // Obtener facturas pendientes del partner
    const pendingInvoices = await this.invoiceRepository.findPendingByPartnerId(
      request.partnerId,
    );
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Calcular crédito disponible y saldo pendiente
    const creditBalance = subscription.creditBalance || 0;
    const outstandingBalance = Math.max(0, totalPending - creditBalance);
    const availableCredit = Math.max(0, creditBalance - totalPending);

    // Obtener últimas 10 facturas pendientes
    const invoiceSummaries: InvoiceSummary[] = pendingInvoices
      .slice(0, 10)
      .map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        total: inv.total,
        dueDate: inv.dueDate,
        status: inv.status,
      }));

    // Obtener últimos 10 pagos
    const paymentSummaries: PaymentSummary[] = paidPayments
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        amount: p.amount,
        paymentDate: p.paymentDate,
        status: p.status,
      }));

    return new GetPartnerAccountBalanceResponse(
      request.partnerId,
      totalPaid,
      totalPending,
      creditBalance,
      outstandingBalance,
      availableCredit,
      subscription.currency,
      subscription.lastPaymentDate,
      subscription.lastPaymentAmount,
      invoiceSummaries,
      paymentSummaries,
    );
  }
}

