import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  IBillingCycleRepository,
  IInvoiceRepository,
  IPartnerRepository,
  BillingCycle,
  Invoice,
  InvoiceItem,
  PartnerSubscription,
  BillingFrequency,
} from '@libs/domain';
import {
  PartnerSubscriptionEntity,
  PartnerMapper,
  InvoiceEntity,
  EmailService,
} from '@libs/infrastructure';
import { CreateBillingCycleHandler } from './create-billing-cycle/create-billing-cycle.handler';
import { CreateInvoiceHandler } from '../invoices/create-invoice/create-invoice.handler';

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
    private readonly createBillingCycleHandler: CreateBillingCycleHandler,
    private readonly createInvoiceHandler: CreateInvoiceHandler,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Cron job que se ejecuta diariamente a las 2:00 AM
   * Revisa suscripciones activas y genera ciclos de facturación automáticamente
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
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

      this.logger.log(
        `Encontradas ${subscriptionsToBill.length} suscripciones para facturar`,
      );

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

      this.logger.log(
        `Generación completada: ${successCount} exitosas, ${errorCount} errores`,
      );
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
    const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);

    this.logger.log(
      `Generando ciclo para suscripción ${subscription.id} (Partner ${subscription.partnerId})`,
    );

    // Calcular fechas del nuevo ciclo
    const startDate = new Date(subscription.currentPeriodEnd);
    startDate.setHours(0, 0, 0, 0);

    const endDate = this.calculateEndDate(startDate, subscription.billingFrequency);
    const billingDate = new Date(); // Hoy
    billingDate.setHours(0, 0, 0, 0);

    const dueDate = new Date(billingDate);
    dueDate.setDate(dueDate.getDate() + 7); // 7 días para pagar

    // Calcular duración en días
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Obtener el último ciclo para calcular el número
    const existingCycles = await this.billingCycleRepository.findBySubscriptionId(
      subscription.id,
    );
    const cycleNumber =
      existingCycles.length > 0
        ? Math.max(...existingCycles.map((c) => c.cycleNumber)) + 1
        : 1;

    // Calcular montos
    const amount = subscription.nextBillingAmount;
    const discountApplied = subscription.discountPercent
      ? amount * (subscription.discountPercent / 100)
      : 0;

    // Calcular subtotal después de descuento
    const subtotalAfterDiscount = amount - discountApplied;

    // Calcular impuestos si aplican
    const taxAmount = subscription.includeTax && subscription.taxPercent
      ? subtotalAfterDiscount * (subscription.taxPercent / 100)
      : 0;

    // Calcular total antes de aplicar crédito
    const totalBeforeCredit = subtotalAfterDiscount + taxAmount;

    // Aplicar crédito disponible si existe (máximo hasta el total de la factura)
    const creditToApply = subscription.creditBalance > 0
      ? Math.min(subscription.creditBalance, totalBeforeCredit)
      : 0;

    const totalAmount = totalBeforeCredit - creditToApply;

    // Crear el ciclo de facturación usando el handler
    const billingCycleRequest = {
      subscriptionId: subscription.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      billingDate: billingDate.toISOString(),
      dueDate: dueDate.toISOString(),
      amount,
      currency: subscription.currency,
      discountApplied: discountApplied > 0 ? discountApplied : undefined,
    };

    const billingCycleResponse = await this.createBillingCycleHandler.execute(
      billingCycleRequest as any,
    );

    // Crear la factura automáticamente con crédito aplicado
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
          unitPrice: subscription.basePrice,
          taxRate: subscription.taxPercent || 0,
          discountPercent: subscription.discountPercent || undefined,
        },
      ],
      discountAmount: discountApplied > 0 ? discountApplied : undefined,
      creditApplied: creditToApply > 0 ? creditToApply : undefined,
      currency: subscription.currency,
      notes: creditToApply > 0
        ? `Factura generada automáticamente. Crédito de ${creditToApply} ${subscription.currency} aplicado.`
        : 'Factura generada automáticamente',
    };

    await this.createInvoiceHandler.execute(invoiceRequest as any);

    // Actualizar la suscripción reduciendo el crédito aplicado
    if (creditToApply > 0) {
      const subscriptionWithCreditApplied = subscription.applyCreditToInvoice(creditToApply);
      await this.subscriptionRepository.save(
        PartnerMapper.subscriptionToPersistence(subscriptionWithCreditApplied),
      );
      this.logger.log(
        `Crédito de ${creditToApply} ${subscription.currency} aplicado automáticamente a factura de suscripción ${subscription.id}`,
      );
    }

    // Actualizar la suscripción con el próximo período
    const nextBillingDate = new Date(endDate);
    nextBillingDate.setDate(nextBillingDate.getDate() + 1);
    nextBillingDate.setHours(0, 0, 0, 0);

    const updatedSubscriptionEntity = {
      ...subscriptionEntity,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      nextBillingDate,
      nextBillingAmount: amount,
      updatedAt: new Date(),
    };

    await this.subscriptionRepository.save(updatedSubscriptionEntity);

    this.logger.log(
      `Ciclo ${cycleNumber} y factura generados exitosamente para suscripción ${subscription.id}`,
    );
  }

  /**
   * Calcula la fecha de fin del período según la frecuencia de facturación
   * Retorna el último día del período (23:59:59.999)
   */
  private calculateEndDate(startDate: Date, frequency: BillingFrequency): Date {
    const endDate = new Date(startDate);

    switch (frequency) {
      case 'monthly':
        // Agregar un mes y restar un día para obtener el último día del mes anterior
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Esto establece el último día del mes anterior
        break;
      case 'quarterly':
        // Agregar 3 meses y restar un día
        endDate.setMonth(endDate.getMonth() + 3);
        endDate.setDate(0);
        break;
      case 'semiannual':
        // Agregar 6 meses y restar un día
        endDate.setMonth(endDate.getMonth() + 6);
        endDate.setDate(0);
        break;
      case 'annual':
        // Agregar un año y restar un día
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1);
        break;
      default:
        // Por defecto, mensual
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
    }

    // Establecer hora al final del día
    endDate.setHours(23, 59, 59, 999);

    return endDate;
  }

  /**
   * Método manual para generar ciclo de facturación (útil para testing o ejecución manual)
   */
  async generateBillingCycleManually(subscriptionId: number): Promise<void> {
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscriptionEntity) {
      throw new Error(`Subscription with ID ${subscriptionId} not found`);
    }

    await this.generateBillingCycleForSubscription(subscriptionEntity);
  }
}

