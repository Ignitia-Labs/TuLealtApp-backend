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
  Payment,
  PaymentMethod,
  InvoicePaymentMethod,
  PartnerSubscription,
} from '@libs/domain';
import {
  PartnerSubscriptionEntity,
  PartnerMapper,
  EmailService,
} from '@libs/infrastructure';
import { CreatePaymentRequest } from './create-payment.request';
import { CreatePaymentResponse } from './create-payment.response';

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
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    private readonly emailService: EmailService,
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
      request.transactionId || null,
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

        // Si el pago es mayor a la factura, convertir excedente a crédito
        if (request.amount > invoice.total) {
          const excessAmount = request.amount - invoice.total;
          const subscriptionWithCredit = subscription.addCredit(excessAmount);
          await this.subscriptionRepository.save(
            PartnerMapper.subscriptionToPersistence(subscriptionWithCredit),
          );
          this.logger.log(
            `Exceso de pago ${excessAmount} ${savedPayment.currency} convertido a crédito para suscripción ${subscription.id}`,
          );
        }
      }

      // Actualizar el ciclo de facturación si existe
      if (billingCycle) {
        const updatedCycle = billingCycle.recordPayment(request.amount, request.paymentMethod);
        await this.billingCycleRepository.update(updatedCycle);
      }

      // Actualizar la suscripción con último pago
      const updatedSubscription = subscription.updateLastPayment(
        savedPayment.amount,
        savedPayment.paymentDate,
      );
      await this.subscriptionRepository.save(
        PartnerMapper.subscriptionToPersistence(updatedSubscription),
      );

      // Si el pago no tiene factura asociada, aplicar a facturas pendientes
      if (!invoice) {
        await this.applyPaymentToPendingInvoices(
          updatedSubscription, // Usar la suscripción actualizada con lastPaymentDate
          savedPayment.amount,
          savedPayment.currency,
          savedPayment.paymentMethod,
          savedPayment.paymentDate,
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
      // Si no hay facturas pendientes, convertir todo el pago a crédito
      const subscriptionWithCredit = subscription.addCredit(paymentAmount);
      await this.subscriptionRepository.save(
        PartnerMapper.subscriptionToPersistence(subscriptionWithCredit),
      );
      this.logger.log(
        `Pago de ${paymentAmount} ${currency} sin factura asociada convertido a crédito para suscripción ${subscription.id}`,
      );
      return;
    }

    let remainingAmount = paymentAmount;

    for (const pendingInvoice of subscriptionInvoices) {
      if (remainingAmount <= 0) break;

      // Calcular cuánto aplicar a esta factura
      const amountToApply = Math.min(remainingAmount, pendingInvoice.total);

      // Crear pago asociado a esta factura
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
        null, // transactionId
        null, // reference
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
      );

      await this.paymentRepository.save(invoicePayment);

      // Actualizar factura
      const paidInvoice = pendingInvoice.markAsPaid(paymentMethod as InvoicePaymentMethod, paymentDate);
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

      remainingAmount -= amountToApply;

      this.logger.log(
        `Pago de ${amountToApply} ${currency} aplicado automáticamente a factura ${pendingInvoice.invoiceNumber}`,
      );
    }

    // Si sobra, convertir a crédito
    if (remainingAmount > 0) {
      const subscriptionWithCredit = subscription.addCredit(remainingAmount);
      await this.subscriptionRepository.save(
        PartnerMapper.subscriptionToPersistence(subscriptionWithCredit),
      );

      this.logger.log(
        `Exceso de pago ${remainingAmount} ${currency} convertido a crédito para suscripción ${subscription.id}`,
      );
    }
  }
}

