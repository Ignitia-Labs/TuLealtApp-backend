import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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
  PartnerSubscription,
  BillingCycle,
} from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper, EmailService } from '@libs/infrastructure';
import { roundToTwoDecimals, registerSubscriptionEvent } from '@libs/shared';
import { CreatePaymentRequest } from './create-payment.request';
import { CreatePaymentResponse } from './create-payment.response';
import { CommissionCalculationService } from '../../commissions/calculate-commission/commission-calculation.service';

/**
 * Handler para el caso de uso de crear un pago
 */
@Injectable()
export class CreatePaymentHandler {
  private readonly logger = new Logger(CreatePaymentHandler.name);

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

  async execute(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    // Validar que la suscripción existe
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { id: request.subscriptionId },
    });

    if (!subscriptionEntity) {
      throw new NotFoundException(`Subscription with ID ${request.subscriptionId} not found`);
    }

    const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);

    // Validar que el partner existe
    const partner = await this.partnerRepository.findById(subscription.partnerId);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${subscription.partnerId} not found`);
    }

    // Validar invoiceId si se proporciona
    let invoice = null;
    if (request.invoiceId) {
      invoice = await this.invoiceRepository.findById(request.invoiceId);
      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${request.invoiceId} not found`);
      }
      if (invoice.subscriptionId !== request.subscriptionId) {
        throw new BadRequestException(
          `Invoice ${request.invoiceId} does not belong to subscription ${request.subscriptionId}`,
        );
      }

      // Validar si la factura ya está pagada
      if (invoice.status === 'paid' || invoice.paymentStatus === 'paid') {
        throw new BadRequestException(
          `Invoice ${request.invoiceId} is already paid. Cannot create payment for a paid invoice.`,
        );
      }

      // Validar si la factura está vencida y mostrar advertencia en el log
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate < today && invoice.status === 'pending') {
        const daysOverdue = Math.ceil(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        this.logger.warn(
          `Payment being created for overdue invoice ${request.invoiceId}. Invoice is ${daysOverdue} days overdue.`,
        );
      }
    }

    // Validar billingCycleId si se proporciona
    let billingCycle = null;
    if (request.billingCycleId) {
      billingCycle = await this.billingCycleRepository.findById(request.billingCycleId);
      if (!billingCycle) {
        throw new NotFoundException(`BillingCycle with ID ${request.billingCycleId} not found`);
      }
      if (billingCycle.subscriptionId !== request.subscriptionId) {
        throw new BadRequestException(
          `BillingCycle ${request.billingCycleId} does not belong to subscription ${request.subscriptionId}`,
        );
      }
    }

    // Validar que invoice y billingCycle coincidan si ambos están presentes
    if (invoice && billingCycle && invoice.billingCycleId !== billingCycle.id) {
      throw new BadRequestException(
        `Invoice ${request.invoiceId} does not belong to BillingCycle ${request.billingCycleId}`,
      );
    }

    // Validar monto si hay factura
    if (invoice && request.amount > invoice.total) {
      throw new BadRequestException(
        `Payment amount ${request.amount} cannot exceed invoice total ${invoice.total}`,
      );
    }

    // Generar transactionId automáticamente
    const transactionId: number = await this.paymentRepository.getNextTransactionId();

    // Crear el pago
    const payment = Payment.create(
      request.subscriptionId,
      subscription.partnerId,
      request.amount,
      request.currency || subscription.currency,
      request.paymentMethod,
      request.invoiceId || null,
      request.billingCycleId || null,
      request.paymentDate ? new Date(request.paymentDate) : new Date(),
      request.status || 'pending',
      transactionId,
      request.reference || null,
      request.confirmationCode || null,
      request.gateway || null,
      request.gatewayTransactionId || null,
      request.cardLastFour || null,
      request.cardBrand || null,
      request.cardExpiry || null,
      request.isRetry || false,
      request.retryAttempt || null,
      request.notes || null,
      null, // processedBy (se puede obtener del contexto de autenticación)
    );

    // Guardar el pago
    const savedPayment = await this.paymentRepository.save(payment);

    // Si el pago es reembolsado, registrar evento de reembolso
    if (savedPayment.status === 'refunded') {
      try {
        const subscriptionEntity = await this.subscriptionRepository.findOne({
          where: { id: request.subscriptionId },
        });
        if (subscriptionEntity) {
          const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);
          await registerSubscriptionEvent(
            {
              type: 'refund_issued',
              subscription,
              paymentId: savedPayment.id,
              invoiceId: invoice?.id || null,
              metadata: {
                amount: savedPayment.amount,
                currency: savedPayment.currency,
                paymentMethod: savedPayment.paymentMethod,
                transactionId: savedPayment.transactionId,
              },
            },
            this.subscriptionEventRepository,
          );
        }
      } catch (error) {
        // Log error pero no fallar el proceso
        this.logger.error('Error registering subscription event for refund:', error);
      }
    }

    // Si el pago falla, registrar evento de pago fallido
    if (savedPayment.status === 'failed') {
      try {
        const subscriptionEntity = await this.subscriptionRepository.findOne({
          where: { id: request.subscriptionId },
        });
        if (subscriptionEntity) {
          const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);
          await registerSubscriptionEvent(
            {
              type: 'payment_failed',
              subscription,
              paymentId: savedPayment.id,
              invoiceId: invoice?.id || null,
              metadata: {
                amount: savedPayment.amount,
                currency: savedPayment.currency,
                paymentMethod: savedPayment.paymentMethod,
                transactionId: savedPayment.transactionId,
              },
            },
            this.subscriptionEventRepository,
          );
        }
      } catch (error) {
        // Log error pero no fallar el proceso
        this.logger.error('Error registering subscription event for failed payment:', error);
      }
    }

    // Si el pago es exitoso, actualizar estados
    if (savedPayment.status === 'paid') {
      // Marcar como procesado
      const processedPayment = savedPayment.markAsProcessed();
      await this.paymentRepository.update(processedPayment);

      // Actualizar la factura si existe
      if (invoice) {
        const paidInvoice = invoice.markAsPaid(request.paymentMethod, new Date());
        await this.invoiceRepository.update(paidInvoice);

        // Enviar email de confirmación de pago
        try {
          await this.emailService.sendPaymentReceivedEmail(
            paidInvoice,
            partner.billingEmail,
            request.amount,
            request.paymentMethod,
          );
        } catch (error) {
          // Log error pero no fallar el proceso de pago
          this.logger.error('Error sending payment confirmation email:', error);
        }

        // Si el pago es mayor a la factura, el excedente se convertirá en crédito disponible
        // NOTA: El crédito se calcula dinámicamente desde los pagos, no se almacena
        if (request.amount > invoice.total) {
          const excessAmount = request.amount - invoice.total;
          this.logger.log(
            `Exceso de pago ${excessAmount} ${savedPayment.currency} disponible como crédito para suscripción ${subscription.id}. ` +
              `El crédito se calculará dinámicamente desde los pagos.`,
          );
        }
      }

      // Actualizar el ciclo de facturación si existe
      let updatedCycle: BillingCycle | null = null;
      let wasBillingCyclePaid = false;
      if (billingCycle) {
        const previousStatus = billingCycle.status;
        updatedCycle = billingCycle.recordPayment(request.amount, request.paymentMethod);
        await this.billingCycleRepository.update(updatedCycle);

        // Verificar si el billing cycle pasó a 'paid'
        wasBillingCyclePaid = previousStatus !== 'paid' && updatedCycle.status === 'paid';
      }

      // Actualizar la suscripción con último pago
      const updatedSubscription = subscription.updateLastPayment(
        savedPayment.amount,
        savedPayment.paymentDate,
      );
      await this.subscriptionRepository.save(
        PartnerMapper.subscriptionToPersistence(updatedSubscription),
      );

      // Calcular comisiones: Si el billing cycle se marcó como 'paid', generar comisiones basadas en el billing cycle
      // Si no hay billing cycle o el ciclo no está pagado, generar comisiones basadas en el pago individual
      try {
        if (updatedCycle && wasBillingCyclePaid) {
          // Generar comisiones basadas en el billing cycle completo
          await this.commissionCalculationService.calculateCommissionsForBillingCycle(updatedCycle);
          this.logger.log(
            `Commissions calculated for billing cycle ${updatedCycle.id} (status changed to 'paid')`,
          );
        } else if (!billingCycle) {
          // Solo generar comisiones para pagos sin billing cycle asociado
          // (pagos directos a la suscripción sin facturación)
          await this.commissionCalculationService.calculateCommissionsForPayment(
            processedPayment,
            partner.id,
            subscription.id,
          );
        }
      } catch (error) {
        // Log error pero no fallar el proceso de pago
        this.logger.error('Error calculating commissions:', error);
      }

      // Registrar evento de suscripción para pago recibido o reintento
      try {
        const eventType = savedPayment.isRetry ? 'payment_retry' : 'payment_received';
        await registerSubscriptionEvent(
          {
            type: eventType,
            subscription: updatedSubscription,
            paymentId: savedPayment.id,
            invoiceId: invoice?.id || null,
            metadata: {
              amount: savedPayment.amount,
              currency: savedPayment.currency,
              paymentMethod: savedPayment.paymentMethod,
              transactionId: savedPayment.transactionId,
              isRetry: savedPayment.isRetry,
              retryAttempt: savedPayment.retryAttempt,
            },
          },
          this.subscriptionEventRepository,
        );
      } catch (error) {
        // Log error pero no fallar el proceso de pago
        this.logger.error('Error registering subscription event:', error);
      }

      // Si el pago no tiene factura asociada, aplicar a facturas y billing cycles pendientes
      if (!invoice) {
        // Primero intentar aplicar a billing cycles pendientes
        await this.applyPaymentToPendingBillingCycles(
          updatedSubscription,
          savedPayment.amount,
          savedPayment.currency,
          savedPayment.paymentMethod,
          savedPayment.paymentDate,
          savedPayment.id, // originalPaymentId
        );
      }
    }

    // Retornar response
    return new CreatePaymentResponse(
      savedPayment.id,
      savedPayment.subscriptionId,
      savedPayment.partnerId,
      savedPayment.invoiceId,
      savedPayment.billingCycleId,
      savedPayment.amount,
      savedPayment.currency,
      savedPayment.paymentMethod,
      savedPayment.status,
      savedPayment.paymentDate,
      savedPayment.processedDate,
      savedPayment.transactionId,
      savedPayment.reference,
      savedPayment.confirmationCode,
      savedPayment.gateway,
      savedPayment.gatewayTransactionId,
      savedPayment.cardLastFour,
      savedPayment.cardBrand,
      savedPayment.cardExpiry,
      savedPayment.isRetry,
      savedPayment.retryAttempt,
      savedPayment.notes,
      savedPayment.processedBy,
      savedPayment.createdAt,
      savedPayment.updatedAt,
    );
  }

  /**
   * Método privado para aplicar pagos sin factura a billing cycles pendientes
   * Aplica el pago a los billing cycles pendientes ordenados por fecha de vencimiento
   * Si sobra dinero, lo convierte a crédito en la suscripción
   */
  private async applyPaymentToPendingBillingCycles(
    subscription: PartnerSubscription,
    paymentAmount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    paymentDate: Date,
    originalPaymentId: number,
  ): Promise<void> {
    // 1. Buscar billing cycles pendientes
    const pendingCycles = await this.billingCycleRepository.findPendingBySubscriptionId(
      subscription.id,
    );

    // Filtrar por moneda y ordenar por dueDate
    const cyclesToApply = pendingCycles
      .filter((cycle) => cycle.currency === currency && cycle.paidAmount < cycle.totalAmount)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    if (cyclesToApply.length === 0) {
      // No hay ciclos pendientes, intentar aplicar a facturas pendientes
      await this.applyPaymentToPendingInvoices(
        subscription,
        paymentAmount,
        currency,
        paymentMethod,
        paymentDate,
        originalPaymentId,
      );
      return;
    }

    let remainingAmount = roundToTwoDecimals(paymentAmount);

    // 2. Aplicar a cada ciclo hasta agotar el pago
    for (const cycle of cyclesToApply) {
      if (remainingAmount <= 0) break;

      const cycleRemaining = roundToTwoDecimals(cycle.totalAmount - cycle.paidAmount);
      const amountToApply = roundToTwoDecimals(Math.min(remainingAmount, cycleRemaining));

      // Obtener el payment original para heredar reference
      const originalPayment = await this.paymentRepository.findById(originalPaymentId);

      // Crear Payment derivado asociado al ciclo
      const cyclePayment = Payment.create(
        subscription.id,
        subscription.partnerId,
        amountToApply,
        currency,
        paymentMethod,
        null, // invoiceId (se asignará cuando se cree la factura)
        cycle.id, // billingCycleId
        paymentDate,
        'paid',
        originalPayment?.transactionId || null, // Heredar transactionId del original
        originalPayment?.reference || null, // Heredar reference del original
        null, // confirmationCode
        null, // gateway
        null, // gatewayTransactionId
        null, // cardLastFour
        null, // cardBrand
        null, // cardExpiry
        false, // isRetry
        null, // retryAttempt
        `Pago aplicado automáticamente a billing cycle ${cycle.cycleNumber}`,
        null, // processedBy
        originalPaymentId, // originalPaymentId - ID del payment original del cual este es derivado
      );

      await this.paymentRepository.save(cyclePayment);

      // Actualizar billing cycle
      const previousStatus = cycle.status;
      const updatedCycle = cycle.recordPayment(amountToApply, paymentMethod);
      await this.billingCycleRepository.update(updatedCycle);

      // Si el billing cycle pasó a 'paid', generar comisiones
      const wasBillingCyclePaid = previousStatus !== 'paid' && updatedCycle.status === 'paid';
      if (wasBillingCyclePaid) {
        try {
          await this.commissionCalculationService.calculateCommissionsForBillingCycle(updatedCycle);
          this.logger.log(
            `Commissions calculated for billing cycle ${updatedCycle.id} (status changed to 'paid' via applyPaymentToPendingBillingCycles)`,
          );
        } catch (error) {
          this.logger.error(
            `Error calculating commissions for billing cycle ${updatedCycle.id}:`,
            error,
          );
        }
      }

      remainingAmount = roundToTwoDecimals(remainingAmount - amountToApply);

      this.logger.log(
        `Pago de ${amountToApply} ${currency} aplicado a billing cycle ${cycle.cycleNumber} (restante: ${remainingAmount})`,
      );
    }

    // 3. Si sobra, intentar aplicar a facturas pendientes
    if (remainingAmount > 0) {
      await this.applyPaymentToPendingInvoices(
        subscription,
        remainingAmount,
        currency,
        paymentMethod,
        paymentDate,
        originalPaymentId,
      );
    }
  }

  /**
   * Método privado para aplicar pagos sin factura a facturas pendientes
   * Aplica el pago a las facturas pendientes ordenadas por fecha de vencimiento
   * Si sobra dinero, lo convierte a crédito en la suscripción
   */
  private async applyPaymentToPendingInvoices(
    subscription: PartnerSubscription,
    paymentAmount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    paymentDate: Date,
    originalPaymentId: number,
  ): Promise<void> {
    // Obtener facturas pendientes ordenadas por fecha de vencimiento
    const pendingInvoices = await this.invoiceRepository.findPendingByPartnerId(
      subscription.partnerId,
    );

    // Filtrar solo facturas de esta suscripción y ordenar por dueDate
    const subscriptionInvoices = pendingInvoices
      .filter((inv) => inv.subscriptionId === subscription.id)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    if (subscriptionInvoices.length === 0) {
      // Si no hay facturas pendientes, el pago completo estará disponible como crédito
      // NOTA: El crédito se calcula dinámicamente desde los pagos, no se almacena
      this.logger.log(
        `Pago de ${paymentAmount} ${currency} sin factura asociada disponible como crédito para suscripción ${subscription.id}. ` +
          `El crédito se calculará dinámicamente desde los pagos.`,
      );
      return;
    }

    let remainingAmount = paymentAmount;

    for (const pendingInvoice of subscriptionInvoices) {
      if (remainingAmount <= 0) break;

      // Calcular cuánto aplicar a esta factura
      const amountToApply = roundToTwoDecimals(Math.min(remainingAmount, pendingInvoice.total));

      // Obtener el payment original para heredar reference
      const originalPayment = await this.paymentRepository.findById(originalPaymentId);

      // Crear payment derivado asociado a esta factura
      const invoicePayment = Payment.create(
        subscription.id,
        subscription.partnerId,
        amountToApply,
        currency,
        paymentMethod,
        pendingInvoice.id,
        pendingInvoice.billingCycleId,
        paymentDate,
        'paid',
        originalPayment?.transactionId || null, // Heredar transactionId del original
        originalPayment?.reference || null, // Heredar reference del original
        null, // confirmationCode
        null, // gateway
        null, // gatewayTransactionId
        null, // cardLastFour
        null, // cardBrand
        null, // cardExpiry
        false, // isRetry
        null, // retryAttempt
        `Pago aplicado automáticamente desde pago sin factura`, // notes
        null, // processedBy
        originalPaymentId, // originalPaymentId - ID del payment original del cual este es derivado
      );

      await this.paymentRepository.save(invoicePayment);

      // Actualizar factura
      const paidInvoice = pendingInvoice.markAsPaid(
        paymentMethod as InvoicePaymentMethod,
        paymentDate,
      );
      await this.invoiceRepository.update(paidInvoice);

      // Actualizar billing cycle si existe
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

      this.logger.log(
        `Pago de ${amountToApply} ${currency} aplicado automáticamente a factura ${pendingInvoice.invoiceNumber}`,
      );
    }

    // Si sobra, estará disponible como crédito
    // NOTA: El crédito se calcula dinámicamente desde los pagos, no se almacena
    if (remainingAmount > 0) {
      this.logger.log(
        `Exceso de pago ${remainingAmount} ${currency} disponible como crédito para suscripción ${subscription.id}. ` +
          `El crédito se calculará dinámicamente desde los pagos.`,
      );
    }
  }
}
