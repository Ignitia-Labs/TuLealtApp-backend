import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IPaymentRepository,
  IInvoiceRepository,
  IBillingCycleRepository,
  IPartnerRepository,
  ISubscriptionEventRepository,
  Payment,
  PaymentMethod,
  InvoicePaymentMethod,
} from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper, EmailService } from '@libs/infrastructure';
import { roundToTwoDecimals, registerSubscriptionEvent } from '@libs/shared';
import { UpdatePaymentStatusRequest } from './update-payment-status.request';
import { UpdatePaymentStatusResponse } from './update-payment-status.response';
import { CommissionCalculationService } from '../../commissions/calculate-commission/commission-calculation.service';

/**
 * Handler para el caso de uso de actualizar el estado de un pago
 */
@Injectable()
export class UpdatePaymentStatusHandler {
  private readonly logger = new Logger(UpdatePaymentStatusHandler.name);

  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IBillingCycleRepository')
    private readonly billingCycleRepository: IBillingCycleRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ISubscriptionEventRepository')
    private readonly subscriptionEventRepository: ISubscriptionEventRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    private readonly emailService: EmailService,
    private readonly commissionCalculationService: CommissionCalculationService,
  ) {}

  async execute(request: UpdatePaymentStatusRequest): Promise<UpdatePaymentStatusResponse> {
    // 1. Validar que el payment existe
    const payment = await this.paymentRepository.findById(request.paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${request.paymentId} not found`);
    }

    // 2. Validar estado actual
    if (payment.status !== 'pending_validation') {
      throw new BadRequestException(
        `Payment can only be validated/rejected when status is 'pending_validation'. ` +
          `Current status: ${payment.status}`,
      );
    }

    // 3. Obtener subscription y partner
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { id: payment.subscriptionId },
    });
    if (!subscriptionEntity) {
      throw new NotFoundException(`Subscription with ID ${payment.subscriptionId} not found`);
    }
    const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);

    const partner = await this.partnerRepository.findById(payment.partnerId);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${payment.partnerId} not found`);
    }

    // 4. SI SE VALIDA
    if (request.newStatus === 'validated') {
      return await this.validatePayment(payment, subscription, partner, request.processedBy);
    }

    // 5. SI SE RECHAZA
    if (request.newStatus === 'rejected') {
      return await this.rejectPayment(payment, request);
    }

    throw new BadRequestException('Invalid newStatus value');
  }

  /**
   * Valida un pago y aplica la lógica de negocio
   */
  private async validatePayment(
    payment: Payment,
    subscription: any,
    partner: any,
    processedBy: number,
  ): Promise<UpdatePaymentStatusResponse> {
    const validatedPayment = payment.markAsValidated(processedBy);
    await this.paymentRepository.update(validatedPayment);

    this.logger.log(
      `Payment ${payment.id} validated by user ${processedBy}. Amount: ${payment.amount} ${payment.currency}`,
    );

    // Obtener invoice y billing cycle si existen
    let invoice = null;
    if (payment.invoiceId) {
      invoice = await this.invoiceRepository.findById(payment.invoiceId);
    }

    let billingCycle = null;
    if (payment.billingCycleId) {
      billingCycle = await this.billingCycleRepository.findById(payment.billingCycleId);
    }

    let invoiceUpdated = false;
    let billingCycleUpdated = false;
    let billingCyclePaid = false;

    // APLICAR LÓGICA DE NEGOCIO (similar a create-payment.handler.ts líneas 219-334)

    // 1. Actualizar invoice si existe
    if (invoice) {
      const paidInvoice = invoice.markAsPaid(payment.paymentMethod, payment.paymentDate);
      await this.invoiceRepository.update(paidInvoice);
      invoiceUpdated = true;

      // Enviar email de confirmación
      try {
        await this.emailService.sendPaymentReceivedEmail(
          paidInvoice,
          partner.billingEmail,
          payment.amount,
          payment.paymentMethod,
        );
      } catch (error) {
        this.logger.error('Error sending payment confirmation email:', error);
      }
    }

    // 2. Actualizar billing cycle si existe
    if (billingCycle) {
      const previousStatus = billingCycle.status;
      const updatedCycle = billingCycle.recordPayment(payment.amount, payment.paymentMethod);
      await this.billingCycleRepository.update(updatedCycle);
      billingCycleUpdated = true;

      billingCyclePaid = previousStatus !== 'paid' && updatedCycle.status === 'paid';

      // Log si es pago parcial
      if (!billingCyclePaid && updatedCycle.paidAmount > 0) {
        this.logger.log(
          `Partial payment applied to billing cycle ${updatedCycle.id}: ` +
            `${updatedCycle.paidAmount}/${updatedCycle.totalAmount} ${updatedCycle.currency} paid`,
        );
      }
    }

    // 3. Actualizar la suscripción con último pago
    const updatedSubscription = subscription.updateLastPayment(
      payment.amount,
      payment.paymentDate,
    );
    await this.subscriptionRepository.save(
      PartnerMapper.subscriptionToPersistence(updatedSubscription),
    );

    // 4. Calcular comisiones
    try {
      if (billingCycle && billingCyclePaid) {
        await this.commissionCalculationService.calculateCommissionsForBillingCycle(
          billingCycle,
        );
        this.logger.log(
          `Commissions calculated for billing cycle ${billingCycle.id} (status changed to 'paid')`,
        );
      } else if (!billingCycle) {
        await this.commissionCalculationService.calculateCommissionsForPayment(
          validatedPayment,
          partner.id,
          subscription.id,
        );
      }
    } catch (error) {
      this.logger.error('Error calculating commissions:', error);
    }

    // 5. Registrar evento de suscripción
    try {
      await registerSubscriptionEvent(
        {
          type: 'payment_received',
          subscription: updatedSubscription,
          paymentId: payment.id,
          invoiceId: invoice?.id || null,
          metadata: {
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId,
            validatedBy: processedBy,
          },
        },
        this.subscriptionEventRepository,
      );
    } catch (error) {
      this.logger.error('Error registering subscription event:', error);
    }

    // 6. Si el pago no tiene invoice/billing cycle, aplicar a pendientes
    let appliedToOtherCycles = 0;
    let appliedToInvoices = 0;

    if (!invoice && !billingCycle) {
      const applicationResult = await this.applyPaymentToPendingBillingCycles(
        updatedSubscription,
        payment.amount,
        payment.currency,
        payment.paymentMethod,
        payment.paymentDate,
        payment.id,
      );
      appliedToOtherCycles = applicationResult.appliedCycles;
      appliedToInvoices = applicationResult.appliedInvoices;
    }

    return new UpdatePaymentStatusResponse(
      payment.id,
      'validated',
      true,
      false,
      processedBy,
      validatedPayment.validatedAt,
      null,
      `Payment validated and applied successfully`,
      {
        invoiceUpdated,
        invoiceId: invoice?.id || null,
        billingCycleUpdated,
        billingCycleId: billingCycle?.id || null,
        billingCyclePaid,
        appliedToOtherCycles,
        appliedToInvoices,
      },
    );
  }

  /**
   * Rechaza un pago
   */
  private async rejectPayment(
    payment: Payment,
    request: UpdatePaymentStatusRequest,
  ): Promise<UpdatePaymentStatusResponse> {
    if (!request.rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting a payment');
    }

    const rejectedPayment = payment.markAsRejected(
      request.processedBy,
      request.rejectionReason,
    );
    await this.paymentRepository.update(rejectedPayment);

    this.logger.log(
      `Payment ${payment.id} rejected by user ${request.processedBy}. ` +
        `Reason: ${request.rejectionReason}`,
    );

    return new UpdatePaymentStatusResponse(
      payment.id,
      'rejected',
      false,
      true,
      request.processedBy,
      rejectedPayment.rejectedAt,
      request.rejectionReason,
      `Payment rejected: ${request.rejectionReason}`,
    );
  }

  /**
   * Aplica un payment a billing cycles pendientes (FIFO)
   */
  private async applyPaymentToPendingBillingCycles(
    subscription: any,
    paymentAmount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    paymentDate: Date,
    originalPaymentId: number,
  ): Promise<{ appliedCycles: number; appliedInvoices: number }> {
    const pendingCycles = await this.billingCycleRepository.findPendingBySubscriptionId(
      subscription.id,
    );

    // Ordenar por dueDate (más antiguo primero) - FIFO
    const cyclesToApply = pendingCycles
      .filter((cycle) => cycle.currency === currency && cycle.paidAmount < cycle.totalAmount)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    if (cyclesToApply.length === 0) {
      const invoiceResult = await this.applyPaymentToPendingInvoices(
        subscription,
        paymentAmount,
        currency,
        paymentMethod,
        paymentDate,
        originalPaymentId,
      );
      return { appliedCycles: 0, appliedInvoices: invoiceResult };
    }

    let remainingAmount = roundToTwoDecimals(paymentAmount);
    let appliedCount = 0;

    for (const cycle of cyclesToApply) {
      if (remainingAmount <= 0) break;

      const cycleRemaining = roundToTwoDecimals(cycle.totalAmount - cycle.paidAmount);
      const amountToApply = roundToTwoDecimals(Math.min(remainingAmount, cycleRemaining));

      const originalPayment = await this.paymentRepository.findById(originalPaymentId);

      const cyclePayment = Payment.create(
        subscription.id,
        subscription.partnerId,
        amountToApply,
        currency,
        paymentMethod,
        null,
        cycle.id,
        paymentDate,
        'validated',
        originalPayment?.transactionId || null,
        originalPayment?.reference || null,
        null,
        null,
        null,
        null,
        null,
        null,
        false,
        null,
        `Payment auto-applied to billing cycle ${cycle.cycleNumber}`,
        null,
        originalPaymentId,
        amountToApply < cycleRemaining,
      );

      await this.paymentRepository.save(cyclePayment);

      const previousStatus = cycle.status;
      const updatedCycle = cycle.recordPayment(amountToApply, paymentMethod);
      await this.billingCycleRepository.update(updatedCycle);

      const wasBillingCyclePaid = previousStatus !== 'paid' && updatedCycle.status === 'paid';
      if (wasBillingCyclePaid) {
        try {
          await this.commissionCalculationService.calculateCommissionsForBillingCycle(
            updatedCycle,
          );
        } catch (error) {
          this.logger.error(`Error calculating commissions for cycle ${updatedCycle.id}:`, error);
        }
      }

      remainingAmount = roundToTwoDecimals(remainingAmount - amountToApply);
      appliedCount++;

      this.logger.log(
        `Payment of ${amountToApply} ${currency} applied to billing cycle ${cycle.cycleNumber}`,
      );
    }

    let appliedInvoices = 0;
    if (remainingAmount > 0) {
      appliedInvoices = await this.applyPaymentToPendingInvoices(
        subscription,
        remainingAmount,
        currency,
        paymentMethod,
        paymentDate,
        originalPaymentId,
      );
    }

    return { appliedCycles: appliedCount, appliedInvoices };
  }

  /**
   * Aplica un payment a invoices pendientes (FIFO)
   */
  private async applyPaymentToPendingInvoices(
    subscription: any,
    paymentAmount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    paymentDate: Date,
    originalPaymentId: number,
  ): Promise<number> {
    const pendingInvoices = await this.invoiceRepository.findPendingByPartnerId(
      subscription.partnerId,
    );

    const subscriptionInvoices = pendingInvoices
      .filter((inv) => inv.subscriptionId === subscription.id)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    if (subscriptionInvoices.length === 0) {
      this.logger.log(
        `Payment of ${paymentAmount} ${currency} available as credit for subscription ${subscription.id}`,
      );
      return 0;
    }

    let remainingAmount = paymentAmount;
    let appliedCount = 0;

    for (const pendingInvoice of subscriptionInvoices) {
      if (remainingAmount <= 0) break;

      const amountToApply = roundToTwoDecimals(Math.min(remainingAmount, pendingInvoice.total));
      const originalPayment = await this.paymentRepository.findById(originalPaymentId);

      const invoicePayment = Payment.create(
        subscription.id,
        subscription.partnerId,
        amountToApply,
        currency,
        paymentMethod,
        pendingInvoice.id,
        pendingInvoice.billingCycleId,
        paymentDate,
        'validated',
        originalPayment?.transactionId || null,
        originalPayment?.reference || null,
        null,
        null,
        null,
        null,
        null,
        null,
        false,
        null,
        `Payment auto-applied to invoice ${pendingInvoice.invoiceNumber}`,
        null,
        originalPaymentId,
        false,
      );

      await this.paymentRepository.save(invoicePayment);

      const paidInvoice = pendingInvoice.markAsPaid(
        paymentMethod as InvoicePaymentMethod,
        paymentDate,
      );
      await this.invoiceRepository.update(paidInvoice);

      if (pendingInvoice.billingCycleId) {
        const billingCycle = await this.billingCycleRepository.findById(
          pendingInvoice.billingCycleId,
        );
        if (billingCycle) {
          const updatedCycle = billingCycle.recordPayment(amountToApply, paymentMethod);
          await this.billingCycleRepository.update(updatedCycle);
        }
      }

      remainingAmount = roundToTwoDecimals(remainingAmount - amountToApply);
      appliedCount++;

      this.logger.log(
        `Payment of ${amountToApply} ${currency} auto-applied to invoice ${pendingInvoice.invoiceNumber}`,
      );
    }

    return appliedCount;
  }
}
