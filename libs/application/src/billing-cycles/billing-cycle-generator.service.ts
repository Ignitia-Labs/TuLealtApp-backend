import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  IBillingCycleRepository,
  IInvoiceRepository,
  IPartnerRepository,
  IPaymentRepository,
  BillingCycle,
  Invoice,
  InvoiceItem,
  PartnerSubscription,
  BillingFrequency,
  Payment,
  PaymentMethod,
  InvoicePaymentMethod,
} from '@libs/domain';
import {
  PartnerSubscriptionEntity,
  PartnerMapper,
  InvoiceEntity,
  EmailService,
} from '@libs/infrastructure';
import { roundToTwoDecimals } from '@libs/shared';
import { CreateBillingCycleHandler } from './create-billing-cycle/create-billing-cycle.handler';
import { CreateInvoiceHandler } from '../invoices/create-invoice/create-invoice.handler';
import { CreditBalanceService } from '../subscriptions/credit-balance.service';
import { CommissionCalculationService } from '../commissions/calculate-commission/commission-calculation.service';

/**
 * Servicio para generar automáticamente ciclos de facturación y facturas
 * Se ejecuta diariamente mediante un cron job
 */
@Injectable()
export class BillingCycleGeneratorService {
  private readonly logger = new Logger(BillingCycleGeneratorService.name);

  constructor(
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @Inject('IBillingCycleRepository')
    private readonly billingCycleRepository: IBillingCycleRepository,
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    private readonly createBillingCycleHandler: CreateBillingCycleHandler,
    private readonly createInvoiceHandler: CreateInvoiceHandler,
    private readonly emailService: EmailService,
    private readonly creditBalanceService: CreditBalanceService,
    private readonly commissionCalculationService: CommissionCalculationService,
  ) {}

  /**
   * Cron job que se ejecuta diariamente a las 2:00 AM
   * Revisa suscripciones activas y genera ciclos de facturación automáticamente
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleDailyBillingCycleGeneration() {
    this.logger.log('Iniciando generación automática de ciclos de facturación...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Buscar suscripciones activas con nextBillingDate <= hoy
      const subscriptionsToBill = await this.subscriptionRepository.find({
        where: {
          status: 'active',
          nextBillingDate: LessThanOrEqual(today),
          autoRenew: true,
        },
      });

      this.logger.log(`Encontradas ${subscriptionsToBill.length} suscripciones para facturar`);

      let successCount = 0;
      let errorCount = 0;

      for (const subscriptionEntity of subscriptionsToBill) {
        try {
          await this.generateBillingCycleForSubscription(subscriptionEntity);
          successCount++;
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Error al generar ciclo para suscripción ${subscriptionEntity.id}:`,
            error.message,
          );
        }
      }

      this.logger.log(`Generación completada: ${successCount} exitosas, ${errorCount} errores`);
    } catch (error) {
      this.logger.error('Error en generación automática de ciclos:', error);
    }
  }

  /**
   * Genera un ciclo de facturación y factura para una suscripción específica
   */
  async generateBillingCycleForSubscription(
    subscriptionEntity: PartnerSubscriptionEntity,
  ): Promise<void> {
    let subscription: PartnerSubscription | null = null;
    try {
      subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);

      this.logger.log(
        `Generando ciclo para suscripción ${subscription.id} (Partner ${subscription.partnerId})`,
      );

      // Validar campos requeridos
      if (!subscription.billingFrequency) {
        throw new InternalServerErrorException(
          `Subscription ${subscription.id} does not have billingFrequency set. Cannot generate billing cycle.`,
        );
      }

      if (subscription.nextBillingAmount === null || subscription.nextBillingAmount === undefined) {
        throw new InternalServerErrorException(
          `Subscription ${subscription.id} does not have nextBillingAmount set. Cannot generate billing cycle.`,
        );
      }

      // Obtener el último ciclo para determinar si es el primero y calcular el número
      const existingCycles = await this.billingCycleRepository.findBySubscriptionId(
        subscription.id,
      );
      const isFirstCycle = existingCycles.length === 0;
      const lastCycle = existingCycles.length > 0 ? existingCycles[0] : null;
      const cycleNumber =
        existingCycles.length > 0 ? Math.max(...existingCycles.map((c) => c.cycleNumber)) + 1 : 1;

      // Calcular startDate del nuevo ciclo
      let startDate: Date;

      if (isFirstCycle) {
        // Es el primer ciclo - debe comenzar desde startDate de la suscripción
        this.logger.log(
          `Generando primer ciclo para suscripción ${subscription.id}. TrialEndDate: ${subscription.trialEndDate ? subscription.trialEndDate.toISOString() : 'null'}, StartDate: ${subscription.startDate ? subscription.startDate.toISOString() : 'null'}`,
        );

        if (subscription.trialEndDate) {
          // Si hay trialEndDate, el ciclo comienza al día siguiente del fin del trial
          startDate = new Date(subscription.trialEndDate);
          startDate.setDate(startDate.getDate() + 1);
          startDate.setHours(0, 0, 0, 0);
          this.logger.log(
            `Primer ciclo: usando trialEndDate + 1 día. StartDate: ${startDate.toISOString()}`,
          );
        } else if (subscription.startDate) {
          // Para el primer ciclo SIN trial, SIEMPRE usar startDate de la suscripción
          // Este es el momento en que se creó la suscripción y debe ser el inicio del primer período facturado
          startDate = new Date(subscription.startDate);
          startDate.setHours(0, 0, 0, 0);
          this.logger.log(
            `Primer ciclo: usando startDate de suscripción (fecha de creación). StartDate: ${startDate.toISOString()}`,
          );
        } else {
          // Fallback: usar hoy si no hay startDate (no debería pasar)
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          this.logger.warn(
            `Primer ciclo: WARNING - No se encontró startDate ni trialEndDate, usando fecha actual. StartDate: ${startDate.toISOString()}`,
          );
        }
      } else {
        // Hay ciclos previos: el nuevo ciclo comienza al día siguiente del fin del último ciclo
        if (!lastCycle) {
          throw new InternalServerErrorException(
            `Subscription ${subscription.id} has existing cycles but lastCycle is null. Cannot generate billing cycle.`,
          );
        }
        startDate = new Date(lastCycle.endDate);
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(0, 0, 0, 0);
        this.logger.log(
          `Ciclo subsiguiente #${cycleNumber}: usando endDate del último ciclo (${lastCycle.cycleNumber}) + 1 día. Último ciclo endDate: ${lastCycle.endDate.toISOString()}, Nuevo startDate: ${startDate.toISOString()}`,
        );
      }

      // Calcular endDate basado en billingFrequency
      const endDate = this.calculateEndDate(startDate, subscription.billingFrequency);
      this.logger.log(
        `Ciclo #${cycleNumber}: StartDate: ${startDate.toISOString()}, EndDate: ${endDate.toISOString()}, BillingFrequency: ${subscription.billingFrequency}`,
      );

      // billingDate es hoy
      const billingDate = subscription.startDate;
      billingDate.setHours(0, 0, 0, 0);

      // Calcular dueDate usando gracePeriodDays de la suscripción
      const gracePeriodDays = subscription.gracePeriodDays || 7; // Default 7 días si no está definido
      const dueDate = new Date(subscription.renewalDate);
      dueDate.setDate(dueDate.getDate() + gracePeriodDays);
      dueDate.setHours(23, 59, 59, 999); // Fin del día
      this.logger.log(
        `Ciclo #${cycleNumber}: BillingDate: ${billingDate.toISOString()}, DueDate: ${dueDate.toISOString()} (gracePeriodDays: ${gracePeriodDays})`,
      );

      // Calcular duración en días
      const durationDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      this.logger.log(`Ciclo #${cycleNumber}: Duración: ${durationDays} días`);

      // Usar los valores ya calculados de la suscripción para evitar errores de redondeo
      // La suscripción ya tiene: basePrice, taxAmount, totalPrice calculados correctamente
      // Convertir a Number para evitar concatenación de strings
      const baseAmount = Number(subscription.basePrice) || 0; // Precio base sin impuestos
      const subscriptionTaxAmount = Number(subscription.taxAmount) || 0; // Impuesto ya calculado
      const subscriptionTotalPrice = Number(subscription.totalPrice) || 0; // Total ya calculado (basePrice + taxAmount)

      // Validar que los valores sean números válidos
      if (isNaN(baseAmount) || isNaN(subscriptionTaxAmount) || isNaN(subscriptionTotalPrice)) {
        throw new Error(
          `Valores inválidos en suscripción ${subscription.id}: basePrice=${subscription.basePrice}, taxAmount=${subscription.taxAmount}, totalPrice=${subscription.totalPrice}`,
        );
      }

      // Aplicar descuento si existe (sobre el basePrice)
      const discountApplied = subscription.discountPercent
        ? roundToTwoDecimals(baseAmount * (subscription.discountPercent / 100))
        : 0;

      // Calcular subtotal después de descuento
      const subtotalAfterDiscount = roundToTwoDecimals(baseAmount - discountApplied);

      // Calcular el impuesto proporcional después del descuento
      // Si hay descuento, el impuesto debe recalcularse proporcionalmente basado en el porcentaje de impuesto
      // Si no hay descuento, usar directamente el taxAmount de la suscripción
      let taxAmount: number;
      if (
        discountApplied > 0 &&
        subscription.taxPercent !== null &&
        subscription.taxPercent !== undefined
      ) {
        const taxPercentValue = Number(subscription.taxPercent);
        if (isNaN(taxPercentValue)) {
          throw new Error(
            `taxPercent inválido: subscription.taxPercent=${subscription.taxPercent}`,
          );
        }
        taxAmount = roundToTwoDecimals(subtotalAfterDiscount * (taxPercentValue / 100));
      } else {
        taxAmount = subscriptionTaxAmount; // Usar el taxAmount de la suscripción si no hay descuento
      }

      // Validar que taxAmount sea un número válido
      if (isNaN(taxAmount)) {
        throw new Error(
          `taxAmount inválido después del cálculo: subtotalAfterDiscount=${subtotalAfterDiscount}, ` +
            `subscription.taxPercent=${subscription.taxPercent}, subscriptionTaxAmount=${subscriptionTaxAmount}`,
        );
      }

      // Validar que taxAmount sea un número válido
      if (isNaN(taxAmount)) {
        throw new Error(
          `taxAmount inválido calculado: subtotalAfterDiscount=${subtotalAfterDiscount}, taxPercent=${subscription.taxPercent}`,
        );
      }

      // Calcular total antes de aplicar pagos y crédito
      // Asegurar que ambos valores sean números antes de sumar
      const subtotalNum = Number(subtotalAfterDiscount);
      const taxAmountNum = Number(taxAmount);
      const totalBeforeCredit = roundToTwoDecimals(subtotalNum + taxAmountNum);

      // Validar que totalBeforeCredit sea un número válido
      if (isNaN(totalBeforeCredit)) {
        throw new Error(
          `totalBeforeCredit inválido: subtotalAfterDiscount=${subtotalAfterDiscount}, taxAmount=${taxAmount}`,
        );
      }

      // Calcular cuánto se puede aplicar desde pagos sin asignar
      const availablePaymentsAmount = await this.calculateAvailablePaymentsAmount(
        subscription.id,
        subscription.currency,
      );

      this.logger.log(
        `[BillingCycle ${cycleNumber}] Montos calculados: ` +
          `baseAmount=${baseAmount}, subtotalAfterDiscount=${subtotalAfterDiscount}, ` +
          `taxAmount=${taxAmount}, totalBeforeCredit=${totalBeforeCredit}, ` +
          `availablePaymentsAmount=${availablePaymentsAmount}`,
      );

      // Calcular cuánto aplicar desde pagos (máximo hasta el total del ciclo)
      // Asegurar que ambos valores sean números antes de operar
      const availablePaymentsAmountNum = Number(availablePaymentsAmount);
      const totalBeforeCreditNum = Number(totalBeforeCredit);
      const paymentAmountToApply = roundToTwoDecimals(
        Math.min(availablePaymentsAmountNum, totalBeforeCreditNum),
      );

      const remainingAfterPayments = roundToTwoDecimals(
        totalBeforeCreditNum - paymentAmountToApply,
      );

      // Calcular crédito disponible dinámicamente desde los pagos reales
      // Esto evita usar valores almacenados que pueden estar desactualizados
      const availableCreditBalance =
        await this.creditBalanceService.calculateAvailableCreditBalance(
          subscription.id,
          subscription.currency,
        );

      this.logger.log(
        `[BillingCycle ${cycleNumber}] Aplicación de recursos: ` +
          `paymentAmountToApply=${paymentAmountToApply}, remainingAfterPayments=${remainingAfterPayments}, ` +
          `availableCreditBalance=${availableCreditBalance}`,
      );

      // Aplicar crédito disponible si existe (máximo hasta el restante después de pagos)
      // NOTA: El crédito se calcula dinámicamente desde los pagos originales que no han sido
      // completamente aplicados. Esto garantiza que siempre usamos valores actualizados.
      // Asegurar que ambos valores sean números antes de operar
      const availableCreditBalanceNum = Number(availableCreditBalance);
      const remainingAfterPaymentsNum = Number(remainingAfterPayments);
      const creditToApply =
        availableCreditBalanceNum > 0
          ? roundToTwoDecimals(Math.min(availableCreditBalanceNum, remainingAfterPaymentsNum))
          : 0;

      this.logger.log(
        `[BillingCycle ${cycleNumber}] Crédito aplicado: ` +
          `creditToApply=${creditToApply} (de ${availableCreditBalance} disponible, ` +
          `limitado por remainingAfterPayments=${remainingAfterPayments})`,
      );

      // Asegurar que ambos valores sean números antes de restar
      const remainingAfterPaymentsForTotal = Number(remainingAfterPayments);
      const creditToApplyNum = Number(creditToApply);
      const totalAmount = roundToTwoDecimals(remainingAfterPaymentsForTotal - creditToApplyNum);
      if (isNaN(totalAmount)) {
        throw new Error(
          `totalAmount inválido: remainingAfterPayments=${remainingAfterPayments}, creditToApply=${creditToApply}`,
        );
      }

      // Crear el ciclo de facturación usando el handler
      // NOTA: amount debe ser el totalPrice (basePrice + taxAmount) para el billing cycle
      // Usar totalBeforeCredit que ya está calculado correctamente en lugar de subscription.totalPrice
      // para asegurar consistencia con los cálculos realizados arriba
      const billingCycleAmount = totalBeforeCreditNum; // Usar totalBeforeCredit que ya está calculado y validado
      if (isNaN(billingCycleAmount)) {
        throw new Error(`billingCycleAmount inválido: totalBeforeCredit=${totalBeforeCreditNum}`);
      }

      const billingCycleRequest = {
        subscriptionId: subscription.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        billingDate: billingDate.toISOString(),
        dueDate: dueDate.toISOString(),
        amount: billingCycleAmount,
        currency: subscription.currency,
        discountApplied: discountApplied > 0 ? discountApplied : undefined,
      };

      this.logger.log(
        `[BillingCycle ${cycleNumber}] Creando billing cycle con: amount=${billingCycleAmount}, ` +
          `discountApplied=${discountApplied}, currency=${subscription.currency}`,
      );

      const billingCycleResponse = await this.createBillingCycleHandler.execute(
        billingCycleRequest as any,
      );

      // Aplicar los pagos encontrados al billing cycle recién creado
      if (paymentAmountToApply > 0) {
        await this.applyPaymentsToBillingCycle(
          subscription.id,
          billingCycleResponse.id,
          subscription.currency,
          paymentAmountToApply,
        );
      }

      // Obtener el billing cycle actualizado después de aplicar pagos para verificar si ya está pagado
      const billingCycleAfterPayments = await this.billingCycleRepository.findById(
        billingCycleResponse.id,
      );

      // Calcular el remanente real después de aplicar los pagos
      const paidAmountValue = billingCycleAfterPayments?.paidAmount || 0;
      if (isNaN(paidAmountValue)) {
        throw new Error(
          `paidAmount inválido en billingCycleAfterPayments: ${billingCycleAfterPayments?.paidAmount}`,
        );
      }

      const remainingAfterPaymentsActual = billingCycleAfterPayments
        ? roundToTwoDecimals(totalBeforeCredit - paidAmountValue)
        : remainingAfterPayments;

      if (isNaN(remainingAfterPaymentsActual)) {
        throw new Error(
          `remainingAfterPaymentsActual inválido: totalBeforeCredit=${totalBeforeCredit}, paidAmountValue=${paidAmountValue}`,
        );
      }

      const isBillingCyclePaid =
        billingCycleAfterPayments && paidAmountValue >= totalBeforeCredit - 0.01;

      // Si el billing cycle ya está completamente pagado, no aplicar crédito adicional
      // Si no está completamente pagado, recalcular el crédito basado en el remanente real
      const finalCreditToApply = isBillingCyclePaid
        ? 0
        : roundToTwoDecimals(Math.min(availableCreditBalance, remainingAfterPaymentsActual));

      if (isNaN(finalCreditToApply)) {
        throw new Error(
          `finalCreditToApply inválido: availableCreditBalance=${availableCreditBalance}, remainingAfterPaymentsActual=${remainingAfterPaymentsActual}`,
        );
      }

      this.logger.log(
        `[BillingCycle ${cycleNumber}] Después de aplicar pagos: ` +
          `paidAmount=${billingCycleAfterPayments?.paidAmount || 0}, ` +
          `totalBeforeCredit=${totalBeforeCredit}, ` +
          `remainingAfterPaymentsActual=${remainingAfterPaymentsActual}, ` +
          `isBillingCyclePaid=${isBillingCyclePaid}, ` +
          `finalCreditToApply=${finalCreditToApply} (original creditToApply=${creditToApply})`,
      );

      // Crear la factura automáticamente con crédito aplicado
      // NOTA: Usar los valores ya calculados de la suscripción para evitar errores de redondeo
      // Pasamos el subtotal y taxAmount ya calculados, y la factura los usará directamente
      const invoiceRequest = {
        subscriptionId: subscription.id,
        billingCycleId: billingCycleResponse.id,
        issueDate: billingDate.toISOString(),
        dueDate: dueDate.toISOString(),
        items: [
          {
            id: '1',
            description: `Suscripción ${subscription.planType} - ${subscription.billingFrequency}`,
            quantity: 1,
            unitPrice: baseAmount, // Usar basePrice (147.25), no subtotalAfterDiscount
            taxRate: subscription.taxPercent || 0,
            discountPercent: subscription.discountPercent || undefined,
          },
        ],
        subtotal: subtotalAfterDiscount, // Pasar el subtotal ya calculado (basePrice después de descuento)
        taxAmount: taxAmount, // Pasar el taxAmount ya calculado (de la suscripción o proporcional)
        discountAmount: discountApplied > 0 ? discountApplied : undefined,
        creditApplied: finalCreditToApply > 0 ? finalCreditToApply : undefined,
        currency: subscription.currency,
        notes:
          finalCreditToApply > 0
            ? `Factura generada automáticamente. Crédito de ${finalCreditToApply} ${subscription.currency} aplicado automáticamente desde el balance de crédito disponible.`
            : 'Factura generada automáticamente',
      };

      // Validar valores del invoiceRequest antes de crear la factura
      const invoiceValuesToValidate = {
        subtotal: subtotalAfterDiscount,
        taxAmount: taxAmount,
        discountAmount: discountApplied,
        creditApplied: finalCreditToApply,
        unitPrice: baseAmount,
      };

      const invalidInvoiceValues = Object.entries(invoiceValuesToValidate).filter(
        ([key, value]) => typeof value === 'number' && isNaN(value),
      );

      if (invalidInvoiceValues.length > 0) {
        throw new Error(
          `Valores inválidos en invoiceRequest: ${JSON.stringify(invalidInvoiceValues, null, 2)}. ` +
            `invoiceRequest completo: ${JSON.stringify(invoiceRequest, null, 2)}`,
        );
      }

      this.logger.log(
        `[BillingCycle ${billingCycleResponse.id}] Creando factura con valores de suscripción: ` +
          `basePrice=${subscription.basePrice}, taxAmount=${subscription.taxAmount}, totalPrice=${subscription.totalPrice}, ` +
          `subtotalAfterDiscount=${subtotalAfterDiscount}, taxAmount=${taxAmount}, ` +
          `discountAmount=${discountApplied}, creditApplied=${finalCreditToApply} ` +
          `(billingCyclePaid=${isBillingCyclePaid}, originalCreditToApply=${creditToApply})`,
      );

      const invoiceResponse = await this.createInvoiceHandler.execute(invoiceRequest as any);

      // Re-fetch el billing cycle después de crear la factura para asegurar que tenemos el estado más reciente
      // Esto es importante porque los pagos pueden haberse aplicado después de crear el billing cycle
      const updatedBillingCycle = await this.billingCycleRepository.findById(
        billingCycleResponse.id,
      );

      if (!updatedBillingCycle) {
        this.logger.warn(
          `[BillingCycle ${billingCycleResponse.id}] No se encontró el billing cycle después de crear la factura`,
        );
        return;
      }

      // Obtener la factura recién creada
      const createdInvoice = await this.invoiceRepository.findById(invoiceResponse.id);
      if (!createdInvoice) {
        this.logger.warn(
          `[BillingCycle ${billingCycleResponse.id}] No se encontró la factura ${invoiceResponse.id} después de crearla`,
        );
        return;
      }

      // Asociar los payments derivados a la factura (siempre, independientemente del estado de pago)
      // Esto asegura que los payments que se aplicaron al billing cycle también estén asociados a la factura
      // Obtener todos los payments asociados a este billing cycle
      const billingCyclePayments = await this.paymentRepository.findByBillingCycleId(
        billingCycleResponse.id,
      );

      this.logger.log(
        `[BillingCycle ${billingCycleResponse.id}] Encontrados ${billingCyclePayments.length} payments para el billing cycle. ` +
          `Detalles: ${billingCyclePayments.map((p) => `id=${p.id}, originalPaymentId=${p.originalPaymentId}, invoiceId=${p.invoiceId}, amount=${p.amount}`).join('; ')}`,
      );

      // Filtrar payments derivados (que tienen originalPaymentId) que aún no tienen invoiceId
      const derivedPaymentsWithoutInvoice = billingCyclePayments.filter(
        (p) => p.originalPaymentId !== null && p.originalPaymentId > 0 && !p.invoiceId,
      );

      this.logger.log(
        `[BillingCycle ${billingCycleResponse.id}] Payments derivados sin invoiceId: ${derivedPaymentsWithoutInvoice.length}. ` +
          `IDs: ${derivedPaymentsWithoutInvoice.map((p) => p.id).join(', ')}`,
      );

      // Asociar los payments derivados a la factura (SIEMPRE, no solo si está pagado)
      for (const derivedPayment of derivedPaymentsWithoutInvoice) {
        this.logger.log(
          `[BillingCycle ${billingCycleResponse.id}] Asociando payment derivado ${derivedPayment.id} ` +
            `(amount=${derivedPayment.amount}, originalPaymentId=${derivedPayment.originalPaymentId}) ` +
            `a factura ${invoiceResponse.id}`,
        );

        // Crear un nuevo Payment con el invoiceId actualizado
        const updatedPayment = new Payment(
          derivedPayment.id,
          derivedPayment.subscriptionId,
          derivedPayment.partnerId,
          invoiceResponse.id, // Asociar a la factura
          derivedPayment.billingCycleId,
          derivedPayment.amount,
          derivedPayment.currency,
          derivedPayment.paymentMethod,
          derivedPayment.status,
          derivedPayment.paymentDate,
          derivedPayment.processedDate,
          derivedPayment.transactionId,
          derivedPayment.reference,
          derivedPayment.confirmationCode,
          derivedPayment.gateway,
          derivedPayment.gatewayTransactionId,
          derivedPayment.cardLastFour,
          derivedPayment.cardBrand,
          derivedPayment.cardExpiry,
          derivedPayment.isRetry,
          derivedPayment.retryAttempt,
          derivedPayment.notes,
          derivedPayment.processedBy,
          derivedPayment.originalPaymentId,
          derivedPayment.isPartialPayment,
          derivedPayment.validatedBy,
          derivedPayment.validatedAt,
          derivedPayment.rejectedBy,
          derivedPayment.rejectedAt,
          derivedPayment.rejectionReason,
          derivedPayment.image,
          derivedPayment.createdAt,
          new Date(), // updatedAt
        );
        const savedPayment = await this.paymentRepository.update(updatedPayment);
        this.logger.log(
          `[BillingCycle ${billingCycleResponse.id}] Payment ${savedPayment.id} actualizado con invoiceId=${savedPayment.invoiceId}`,
        );
      }

      // Verificar si el billing cycle ya está completamente pagado después de aplicar los pagos
      // Si es así, marcar la factura como pagada también
      // Usar una tolerancia pequeña para manejar diferencias de redondeo
      const billingCyclePaidAmount = updatedBillingCycle.paidAmount || 0;
      const invoiceTotal = createdInvoice.total || 0;
      const isInvoiceFullyPaid = billingCyclePaidAmount >= invoiceTotal - 0.01;

      this.logger.log(
        `[BillingCycle ${billingCycleResponse.id}] Verificando estado de pago: ` +
          `billingCyclePaidAmount=${billingCyclePaidAmount}, invoiceTotal=${invoiceTotal}, ` +
          `isInvoiceFullyPaid=${isInvoiceFullyPaid}, invoiceStatus=${createdInvoice.status}`,
      );

      if (isInvoiceFullyPaid && createdInvoice.status === 'pending') {
        // Obtener el método de pago del billing cycle (si hay pagos aplicados)
        const paymentMethod: InvoicePaymentMethod = updatedBillingCycle.paymentMethod
          ? (updatedBillingCycle.paymentMethod as InvoicePaymentMethod)
          : 'bank_transfer'; // Default si no hay método específico

        // Marcar la factura como pagada
        const paidInvoice = createdInvoice.markAsPaid(
          paymentMethod,
          updatedBillingCycle.paymentDate || new Date(),
        );
        const updatedPaidInvoice = await this.invoiceRepository.update(paidInvoice);

        // Re-fetch la factura para asegurarnos de que el estado se guardó correctamente
        const finalPaidInvoice = await this.invoiceRepository.findById(invoiceResponse.id);
        const finalInvoiceStatus = finalPaidInvoice?.status || updatedPaidInvoice.status;

        this.logger.log(
          `[BillingCycle ${billingCycleResponse.id}] Factura ${invoiceResponse.invoiceNumber} marcada como pagada automáticamente. ` +
            `paidAmount=${billingCyclePaidAmount}, invoiceTotal=${invoiceTotal}, ` +
            `paymentMethod=${paymentMethod}, invoiceStatus=${finalInvoiceStatus}. ` +
            `${derivedPaymentsWithoutInvoice.length} payments derivados asociados a la factura.`,
        );
      } else {
        this.logger.log(
          `[BillingCycle ${billingCycleResponse.id}] Factura ${invoiceResponse.invoiceNumber} NO marcada como pagada. ` +
            `Razón: isInvoiceFullyPaid=${isInvoiceFullyPaid}, invoiceStatus=${createdInvoice.status}, ` +
            `billingCyclePaidAmount=${billingCyclePaidAmount}, invoiceTotal=${invoiceTotal}. ` +
            `${derivedPaymentsWithoutInvoice.length} payments derivados asociados a la factura.`,
        );
      }

      // Log sobre el crédito aplicado
      // NOTA: Ya no actualizamos el creditBalance almacenado porque siempre se calcula dinámicamente
      if (creditToApply > 0) {
        this.logger.log(
          `[BillingCycle ${billingCycleResponse.id}] ` +
            `Crédito aplicado automáticamente: ${creditToApply} ${subscription.currency} ` +
            `(calculado dinámicamente desde pagos reales: ${availableCreditBalance} ${subscription.currency} disponible) ` +
            `a factura ${invoiceResponse.invoiceNumber} de suscripción ${subscription.id}.`,
        );
      } else if (availableCreditBalance > 0 && creditToApply === 0) {
        // Log cuando hay crédito disponible pero no se aplica (porque el ciclo ya está pagado)
        this.logger.log(
          `[BillingCycle ${billingCycleResponse.id}] ` +
            `Crédito disponible (${availableCreditBalance} ${subscription.currency}) ` +
            `no aplicado porque el billing cycle ya está completamente pagado.`,
        );
      }

      // Actualizar la suscripción con el próximo período
      const nextBillingDate = new Date(endDate);
      nextBillingDate.setDate(nextBillingDate.getDate() + 1);
      nextBillingDate.setHours(0, 0, 0, 0);

      // Asegurarse de que nextBillingAmount esté redondeado a 2 decimales
      // Usar totalPrice de la suscripción que ya incluye impuestos
      const nextBillingAmountValue = subscription.totalPrice || subscriptionTotalPrice || 0;
      if (isNaN(nextBillingAmountValue)) {
        throw new Error(
          `nextBillingAmount inválido: subscription.totalPrice=${subscription.totalPrice}, subscriptionTotalPrice=${subscriptionTotalPrice}`,
        );
      }
      const roundedNextBillingAmount = roundToTwoDecimals(nextBillingAmountValue);
      if (isNaN(roundedNextBillingAmount)) {
        throw new Error(
          `roundedNextBillingAmount inválido después de roundToTwoDecimals: nextBillingAmountValue=${nextBillingAmountValue}`,
        );
      }

      // Validar todos los valores numéricos antes de guardar
      const valuesToValidate = {
        roundedNextBillingAmount,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        nextBillingDate,
      };

      this.logger.log(
        `[BillingCycle ${cycleNumber}] Actualizando suscripción con: ` +
          `nextBillingAmount=${roundedNextBillingAmount}, ` +
          `currentPeriodStart=${startDate.toISOString()}, ` +
          `currentPeriodEnd=${endDate.toISOString()}, ` +
          `nextBillingDate=${nextBillingDate.toISOString()}`,
      );

      const updatedSubscriptionEntity = {
        ...subscriptionEntity,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        nextBillingDate,
        nextBillingAmount: roundedNextBillingAmount,
        updatedAt: new Date(),
      };

      // Validar que no haya valores NaN en el objeto antes de guardar
      const entityValues = Object.values(updatedSubscriptionEntity);
      const nanValues = entityValues.filter((v) => typeof v === 'number' && isNaN(v));
      if (nanValues.length > 0) {
        throw new Error(
          `Valores NaN encontrados en updatedSubscriptionEntity: ${JSON.stringify(updatedSubscriptionEntity, null, 2)}`,
        );
      }

      await this.subscriptionRepository.save(updatedSubscriptionEntity);

      this.logger.log(
        `Ciclo ${cycleNumber} y factura generados exitosamente para suscripción ${subscription.id}. Período: ${startDate.toISOString()} - ${endDate.toISOString()}. Suscripción actualizada: currentPeriodStart=${startDate.toISOString()}, currentPeriodEnd=${endDate.toISOString()}, nextBillingDate=${nextBillingDate.toISOString()}`,
      );
    } catch (error) {
      // Si ya es una excepción de NestJS, relanzarla
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      // Para otros errores, loguear y relanzar como InternalServerErrorException
      const subscriptionId = subscription?.id || subscriptionEntity?.id || 'unknown';
      this.logger.error(
        `Error generating billing cycle for subscription ${subscriptionId}:`,
        error.stack || error.message,
      );
      throw new InternalServerErrorException(
        `Error generating billing cycle: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Calcula la fecha de fin del período según la frecuencia de facturación
   * Retorna el último día del período (23:59:59.999)
   * El período comienza en startDate y termina en endDate (inclusive)
   */
  private calculateEndDate(startDate: Date, frequency: BillingFrequency): Date {
    const endDate = new Date(startDate);

    switch (frequency) {
      case 'monthly':
        // Agregar un mes y restar un día para obtener el último día del período mensual
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1);
        break;
      case 'quarterly':
        // Agregar 3 meses y restar un día
        endDate.setMonth(endDate.getMonth() + 3);
        endDate.setDate(endDate.getDate() - 1);
        break;
      case 'semiannual':
        // Agregar 6 meses y restar un día
        endDate.setMonth(endDate.getMonth() + 6);
        endDate.setDate(endDate.getDate() - 1);
        break;
      case 'annual':
        // Agregar un año y restar un día
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1);
        break;
      default:
        // Por defecto, mensual
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1);
    }

    // Establecer hora al final del día
    endDate.setHours(23, 59, 59, 999);

    return endDate;
  }

  /**
   * Método manual para generar ciclo de facturación (útil para testing o ejecución manual)
   */
  async generateBillingCycleManually(subscriptionId: number): Promise<void> {
    try {
      const subscriptionEntity = await this.subscriptionRepository.findOne({
        where: { id: subscriptionId },
      });

      if (!subscriptionEntity) {
        throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
      }

      // Validar que la suscripción tenga los campos requeridos
      if (!subscriptionEntity.currentPeriodEnd) {
        throw new InternalServerErrorException(
          `Subscription with ID ${subscriptionId} does not have currentPeriodEnd set. Cannot generate billing cycle.`,
        );
      }

      await this.generateBillingCycleForSubscription(subscriptionEntity);
    } catch (error) {
      // Si ya es una excepción de NestJS, relanzarla
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      // Para otros errores, loguear y relanzar como InternalServerErrorException
      this.logger.error(
        `Error generating billing cycle manually for subscription ${subscriptionId}:`,
        error.stack || error.message,
      );
      throw new InternalServerErrorException(
        `Error generating billing cycle: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Calcula el monto total disponible de pagos sin asignar
   * NOTA: Calcula el monto REALMENTE disponible de cada pago (monto original menos payments derivados ya aplicados)
   */
  private async calculateAvailablePaymentsAmount(
    subscriptionId: number,
    currency: string,
  ): Promise<number> {
    const unassignedPayments = await this.paymentRepository.findUnassignedBySubscriptionId(
      subscriptionId,
      currency,
    );

    // Calcular el monto realmente disponible de cada pago
    let totalAvailable = 0;
    for (const payment of unassignedPayments) {
      // Obtener todos los payments derivados de este payment original
      const derivedPayments = await this.paymentRepository.findDerivedByOriginalPaymentId(
        payment.id,
      );

      // Filtrar solo payments derivados que están realmente aplicados a un billing cycle o invoice válido
      const validDerivedPayments = derivedPayments.filter(
        (dp) => dp.billingCycleId !== null || dp.invoiceId !== null,
      );

      // Calcular cuánto se ha aplicado de este payment original
      const appliedAmount = validDerivedPayments.reduce((sum, dp) => sum + Number(dp.amount), 0);

      // El monto disponible es el remanente del payment original
      const remainingAmount = Math.max(0, Number(payment.amount) - appliedAmount);
      totalAvailable += remainingAmount;
    }

    return roundToTwoDecimals(totalAvailable);
  }

  /**
   * Aplica pagos específicos a un billing cycle
   * Maneja pagos mayores que el ciclo aplicando el resto a otros ciclos pendientes
   */
  private async applyPaymentsToBillingCycle(
    subscriptionId: number,
    billingCycleId: number,
    currency: string,
    amountToApply: number,
  ): Promise<void> {
    const billingCycle = await this.billingCycleRepository.findById(billingCycleId);
    if (!billingCycle) {
      this.logger.warn(`BillingCycle ${billingCycleId} no encontrado para aplicar pagos`);
      return;
    }

    // Buscar pagos sin asignar que se aplicaron
    const unassignedPayments = await this.paymentRepository.findUnassignedBySubscriptionId(
      subscriptionId,
      currency,
    );

    let remainingToApply = roundToTwoDecimals(amountToApply);
    let currentCycle = billingCycle;

    for (const payment of unassignedPayments) {
      if (remainingToApply <= 0) break;

      // Obtener todos los payments derivados de este payment original usando originalPaymentId
      const derivedPayments = await this.paymentRepository.findDerivedByOriginalPaymentId(
        payment.id,
      );

      // Filtrar solo payments derivados que están realmente aplicados a un billing cycle o invoice válido
      const validDerivedPayments = derivedPayments.filter(
        (dp) => dp.billingCycleId !== null || dp.invoiceId !== null,
      );

      // Si ya existe un payment derivado para este billing cycle específico, saltar
      const alreadyAppliedToThisCycle = validDerivedPayments.some(
        (p) => p.billingCycleId === billingCycleId,
      );

      if (alreadyAppliedToThisCycle) {
        this.logger.warn(
          `Payment ${payment.id} already has a derived payment for billing cycle ${billingCycleId}, skipping duplicate creation`,
        );
        continue;
      }

      // Calcular cuánto se ha aplicado de este payment original
      const totalApplied = validDerivedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remainingFromOriginal = roundToTwoDecimals(Number(payment.amount) - totalApplied);

      if (remainingFromOriginal <= 0) {
        this.logger.warn(
          `Payment ${payment.id} has already been fully applied to other billing cycles (totalApplied: ${totalApplied}, amount: ${payment.amount}), skipping`,
        );
        continue;
      }

      // Calcular cuánto se puede aplicar al ciclo actual (usar el remanente del payment original)
      const cycleRemaining = roundToTwoDecimals(currentCycle.totalAmount - currentCycle.paidAmount);
      const amountFromThisPayment = roundToTwoDecimals(
        Math.min(remainingFromOriginal, remainingToApply, cycleRemaining),
      );

      // Si el monto a aplicar es 0 o negativo, saltar este payment
      if (amountFromThisPayment <= 0) {
        this.logger.warn(
          `Payment ${payment.id} has no remaining amount to apply (remaining: ${remainingFromOriginal}, cycle remaining: ${cycleRemaining}, remainingToApply: ${remainingToApply}), skipping`,
        );
        continue;
      }

      // Crear Payment derivado asociado al billing cycle
      // Los payments derivados heredan transactionId y reference del original
      const appliedPayment = Payment.create(
        payment.subscriptionId,
        payment.partnerId,
        amountFromThisPayment,
        payment.currency,
        payment.paymentMethod,
        null, // invoiceId (se asignará cuando se cree la factura)
        billingCycleId, // Asociar al nuevo ciclo
        payment.paymentDate,
        'paid',
        payment.transactionId, // Heredar transactionId del original
        payment.reference, // Heredar reference del original
        payment.confirmationCode,
        payment.gateway,
        payment.gatewayTransactionId,
        payment.cardLastFour,
        payment.cardBrand,
        payment.cardExpiry,
        payment.isRetry,
        payment.retryAttempt,
        `Aplicado desde pago ${payment.id} (${amountFromThisPayment} de ${payment.amount})`,
        payment.processedBy,
        payment.id, // originalPaymentId - ID del payment original del cual este es derivado
      );

      await this.paymentRepository.save(appliedPayment);

      // Actualizar billing cycle
      currentCycle = currentCycle.recordPayment(amountFromThisPayment, payment.paymentMethod);
      await this.billingCycleRepository.update(currentCycle);

      remainingToApply = roundToTwoDecimals(remainingToApply - amountFromThisPayment);

      this.logger.log(
        `Pago ${payment.id}: ${amountFromThisPayment} ${currency} aplicado a billing cycle ${billingCycleId} (remanente del payment: ${remainingFromOriginal - amountFromThisPayment})`,
      );

      // Calcular el remanente real del payment después de aplicar al ciclo actual
      const paymentRemaining = roundToTwoDecimals(remainingFromOriginal - amountFromThisPayment);
      if (paymentRemaining > 0) {
        // Aplicar el resto a ciclos pendientes existentes
        await this.applyRemainingPaymentToPendingCycles(
          payment,
          paymentRemaining,
          billingCycleId, // Excluir el ciclo que acabamos de crear
        );
      }
    }
  }

  /**
   * Aplica el resto de un pago a billing cycles pendientes existentes
   */
  private async applyRemainingPaymentToPendingCycles(
    originalPayment: Payment,
    remainingAmount: number,
    excludeBillingCycleId?: number,
  ): Promise<void> {
    // Recalcular el remanente real del payment considerando todos los payments derivados
    // Esto asegura que siempre usamos el valor correcto, incluso si hay cambios concurrentes
    const derivedPayments = await this.paymentRepository.findDerivedByOriginalPaymentId(
      originalPayment.id,
    );
    const validDerivedPayments = derivedPayments.filter(
      (dp) => dp.billingCycleId !== null || dp.invoiceId !== null,
    );
    const totalApplied = validDerivedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const actualRemaining = roundToTwoDecimals(Number(originalPayment.amount) - totalApplied);

    // Usar el mínimo entre el remanente calculado y el pasado como parámetro para seguridad
    const remainingToUse = Math.min(actualRemaining, remainingAmount);

    if (remainingToUse <= 0) {
      this.logger.log(
        `Payment ${originalPayment.id} no tiene remanente disponible (actualRemaining: ${actualRemaining}, remainingAmount: ${remainingAmount})`,
      );
      return;
    }

    // Buscar billing cycles pendientes (excluyendo el que acabamos de crear)
    const pendingCycles = await this.billingCycleRepository.findPendingBySubscriptionId(
      originalPayment.subscriptionId,
    );

    // Filtrar y ordenar por dueDate
    const cyclesToApply = pendingCycles
      .filter(
        (cycle) =>
          cycle.id !== excludeBillingCycleId &&
          cycle.currency === originalPayment.currency &&
          cycle.paidAmount < cycle.totalAmount,
      )
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    if (cyclesToApply.length === 0) {
      // No hay ciclos pendientes, el restante estará disponible como crédito
      // NOTA: El crédito se calcula dinámicamente desde los pagos, no se almacena
      this.logger.log(
        `Restante de pago ${originalPayment.id} (${remainingToUse} ${originalPayment.currency}) ` +
          `disponible como crédito. El crédito se calculará dinámicamente desde los pagos.`,
      );
      return;
    }

    let remainingToApply = roundToTwoDecimals(remainingToUse);

    for (const cycle of cyclesToApply) {
      if (remainingToApply <= 0) break;

      // Verificar si este payment ya fue aplicado a este billing cycle específico
      // Ya tenemos derivedPayments calculado arriba, reutilizarlo
      const alreadyAppliedToThisCycle = validDerivedPayments.some(
        (p) => p.billingCycleId === cycle.id,
      );

      if (alreadyAppliedToThisCycle) {
        this.logger.warn(
          `Payment ${originalPayment.id} already has a derived payment for billing cycle ${cycle.id}, skipping duplicate creation`,
        );
        continue;
      }

      const cycleRemaining = roundToTwoDecimals(cycle.totalAmount - cycle.paidAmount);
      const amountToApply = roundToTwoDecimals(Math.min(remainingToApply, cycleRemaining));

      // Si el monto a aplicar es 0 o negativo, saltar
      if (amountToApply <= 0) {
        continue;
      }

      // Validar que no exista un pago con el mismo transactionId si el payment original tiene uno
      // Crear Payment derivado
      // Los payments derivados heredan transactionId y reference del original
      const appliedPayment = Payment.create(
        originalPayment.subscriptionId,
        originalPayment.partnerId,
        amountToApply,
        originalPayment.currency,
        originalPayment.paymentMethod,
        null,
        cycle.id,
        originalPayment.paymentDate,
        'paid',
        originalPayment.transactionId, // Heredar transactionId del original
        originalPayment.reference, // Heredar reference del original
        originalPayment.confirmationCode,
        originalPayment.gateway,
        originalPayment.gatewayTransactionId,
        originalPayment.cardLastFour,
        originalPayment.cardBrand,
        originalPayment.cardExpiry,
        originalPayment.isRetry,
        originalPayment.retryAttempt,
        `Aplicado desde pago ${originalPayment.id} (${amountToApply} de ${originalPayment.amount})`,
        originalPayment.processedBy,
        originalPayment.id, // originalPaymentId - ID del payment original del cual este es derivado
      );

      await this.paymentRepository.save(appliedPayment);

      // Actualizar ciclo
      const previousStatus = cycle.status;
      const updatedCycle = cycle.recordPayment(amountToApply, originalPayment.paymentMethod);
      await this.billingCycleRepository.update(updatedCycle);

      // Si el billing cycle pasó a 'paid', generar comisiones
      const wasBillingCyclePaid = previousStatus !== 'paid' && updatedCycle.status === 'paid';
      if (wasBillingCyclePaid) {
        try {
          await this.commissionCalculationService.calculateCommissionsForBillingCycle(updatedCycle);
          this.logger.log(
            `Commissions calculated for billing cycle ${updatedCycle.id} (status changed to 'paid' via applyRemainingPaymentToPendingCycles)`,
          );
        } catch (error) {
          this.logger.error(
            `Error calculating commissions for billing cycle ${updatedCycle.id}:`,
            error,
          );
        }
      }

      remainingToApply = roundToTwoDecimals(remainingToApply - amountToApply);

      this.logger.log(
        `Restante de pago ${originalPayment.id}: ${amountToApply} ${originalPayment.currency} aplicado a billing cycle ${cycle.cycleNumber}`,
      );
    }

    // Si aún sobra, estará disponible como crédito
    // NOTA: El crédito se calcula dinámicamente desde los pagos, no se almacena
    if (remainingToApply > 0) {
      this.logger.log(
        `Restante final de pago ${originalPayment.id} (${remainingToApply} ${originalPayment.currency}) ` +
          `disponible como crédito. El crédito se calculará dinámicamente desde los pagos.`,
      );
    }
  }
}
