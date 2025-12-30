import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IInvoiceRepository,
  IBillingCycleRepository,
  IPartnerRepository,
  Invoice,
  InvoiceItem,
  BillingCycle,
  InvoicePaymentMethod,
} from '@libs/domain';
import {
  PartnerSubscriptionEntity,
  PartnerMapper,
  InvoiceEntity,
  InvoicePdfService,
  EmailService,
} from '@libs/infrastructure';
import { roundToTwoDecimals } from '@libs/shared';
import { CreateInvoiceRequest } from './create-invoice.request';
import { CreateInvoiceResponse, InvoiceItemResponse } from './create-invoice.response';

/**
 * Handler para el caso de uso de crear una factura
 */
@Injectable()
export class CreateInvoiceHandler {
  constructor(
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IBillingCycleRepository')
    private readonly billingCycleRepository: IBillingCycleRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceEntityRepository: Repository<InvoiceEntity>,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly emailService: EmailService,
  ) {}

  async execute(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
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

    // Validar items
    if (!request.items || request.items.length === 0) {
      throw new BadRequestException('Invoice must have at least one item');
    }

    // Procesar items y calcular totales
    // Si se proporcionan subtotal y taxAmount en el request, usarlos directamente (valores de la suscripción)
    // Esto evita errores de redondeo y asegura consistencia con los valores de la suscripción
    const usePreCalculatedValues =
      request.subtotal !== undefined && request.taxAmount !== undefined;

    const processedItems: InvoiceItem[] = [];
    let subtotal = 0;
    let totalTaxAmount = 0;

    if (usePreCalculatedValues) {
      // Usar los valores ya calculados de la suscripción directamente
      // Asegurarse de que sean números, no strings
      subtotal = Number(request.subtotal) || 0;
      totalTaxAmount = Number(request.taxAmount) || 0;

      // Validar que los valores sean números válidos
      if (isNaN(subtotal) || isNaN(totalTaxAmount)) {
        throw new BadRequestException(
          `Valores inválidos en request: subtotal=${request.subtotal}, taxAmount=${request.taxAmount}`,
        );
      }

      // Procesar items usando los valores pre-calculados de la suscripción
      // El unitPrice es basePrice, el amount es subtotal (después de descuento si aplica),
      // y el taxAmount es el taxAmount de la suscripción
      for (const item of request.items) {
        const unitPrice = Number(item.unitPrice) || 0; // basePrice de la suscripción
        const itemSubtotalAfterDiscount = Number(request.subtotal) || 0; // subtotal después de descuento
        const taxRate = Number(item.taxRate) || 0;
        const itemTaxAmount = Number(request.taxAmount) || 0; // taxAmount de la suscripción
        const discountPercent = Number(item.discountPercent) || 0;
        const discountAmount = Number(request.discountAmount) || 0;

        // Validar que todos los valores sean números válidos
        if (
          isNaN(unitPrice) ||
          isNaN(itemSubtotalAfterDiscount) ||
          isNaN(taxRate) ||
          isNaN(itemTaxAmount) ||
          isNaN(discountPercent) ||
          isNaN(discountAmount)
        ) {
          throw new BadRequestException(
            `Valores inválidos en item: unitPrice=${item.unitPrice}, ` +
              `subtotal=${request.subtotal}, taxRate=${item.taxRate}, taxAmount=${request.taxAmount}`,
          );
        }

        // Calcular el total del item: subtotal + taxAmount (redondeado)
        const itemTotal = roundToTwoDecimals(itemSubtotalAfterDiscount + itemTaxAmount);

        if (isNaN(itemTotal) || !isFinite(itemTotal)) {
          throw new BadRequestException(
            `itemTotal inválido: itemSubtotalAfterDiscount=${itemSubtotalAfterDiscount}, ` +
              `itemTaxAmount=${itemTaxAmount}, itemTotal=${itemTotal}`,
          );
        }

        processedItems.push({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: unitPrice, // basePrice (147.25)
          amount: itemSubtotalAfterDiscount, // subtotal después de descuento (147.25)
          taxRate,
          taxAmount: itemTaxAmount, // taxAmount de la suscripción (17.67)
          discountPercent: discountPercent > 0 ? discountPercent : undefined,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          total: itemTotal, // subtotal + taxAmount (164.92) - redondeado
        });
      }
    } else {
      // Calcular valores desde los items (comportamiento anterior para compatibilidad)
      for (const item of request.items) {
        // Convertir todos los valores a Number para evitar concatenación de strings
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const discountPercent = Number(item.discountPercent) || 0;
        const taxRate = Number(item.taxRate) || 0;

        const amount = quantity * unitPrice;
        const discountAmount = amount * (discountPercent / 100);
        const itemSubtotalAfterDiscount = amount - discountAmount;
        const itemTaxAmount = itemSubtotalAfterDiscount * (taxRate / 100);
        const itemTotal = itemSubtotalAfterDiscount + itemTaxAmount;

        processedItems.push({
          id: item.id,
          description: item.description,
          quantity: quantity,
          unitPrice: unitPrice,
          amount: itemSubtotalAfterDiscount,
          taxRate,
          taxAmount: itemTaxAmount,
          discountPercent: discountPercent > 0 ? discountPercent : undefined,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          total: itemTotal,
        });

        // Asegurar que subtotal y totalTaxAmount sean números antes de sumar
        subtotal = Number(subtotal) + Number(itemSubtotalAfterDiscount);
        totalTaxAmount = Number(totalTaxAmount) + Number(itemTaxAmount);
      }
    }

    // Aplicar descuento total adicional si se proporciona (además del descuento del item)
    // Asegurarse de que sean números, no strings
    const discountAmount = Number(request.discountAmount) || 0;
    const creditApplied = Number(request.creditApplied) || 0;

    // Si usamos valores pre-calculados, usar el taxAmount del request (convertido a número)
    // Si no, usar el totalTaxAmount calculado
    const finalTaxAmount = usePreCalculatedValues ? Number(request.taxAmount) || 0 : totalTaxAmount;

    // Asegurarse de que subtotal también sea número cuando se usan valores pre-calculados
    const finalSubtotal = usePreCalculatedValues ? Number(request.subtotal) || 0 : subtotal;

    // Validar que todos los valores sean números válidos antes de calcular el total
    const valuesToValidate = {
      subtotal: finalSubtotal,
      finalTaxAmount,
      discountAmount,
      creditApplied,
    };

    const invalidValues = Object.entries(valuesToValidate).filter(
      ([, value]) => typeof value === 'number' && (isNaN(value) || !isFinite(value)),
    );

    if (invalidValues.length > 0) {
      throw new BadRequestException(
        `Valores inválidos al calcular el total de la factura: ${JSON.stringify(invalidValues, null, 2)}. ` +
          `subtotal=${finalSubtotal}, finalTaxAmount=${finalTaxAmount}, discountAmount=${discountAmount}, creditApplied=${creditApplied}`,
      );
    }

    const total = roundToTwoDecimals(
      finalSubtotal + finalTaxAmount - discountAmount - creditApplied,
    );

    if (isNaN(total) || !isFinite(total)) {
      throw new BadRequestException(
        `Total inválido calculado: subtotal=${finalSubtotal}, finalTaxAmount=${finalTaxAmount}, ` +
          `discountAmount=${discountAmount}, creditApplied=${creditApplied}, total=${total}`,
      );
    }

    if (total < 0) {
      throw new BadRequestException('Total amount cannot be negative after discounts and credits');
    }

    // Generar número de factura único
    const invoiceNumber = await this.generateInvoiceNumber();

    // Crear la factura
    const invoice = Invoice.create(
      invoiceNumber,
      request.subscriptionId,
      subscription.partnerId,
      partner.businessName,
      partner.taxId,
      partner.fiscalAddress,
      partner.billingEmail,
      new Date(request.issueDate),
      new Date(request.dueDate),
      finalSubtotal, // Usar el subtotal correcto (pre-calculado o calculado)
      finalTaxAmount, // Usar el taxAmount correcto (pre-calculado o calculado)
      total,
      request.currency || subscription.currency,
      processedItems,
      request.billingCycleId || null,
      discountAmount,
      creditApplied,
      null, // paidDate
      'pending', // status
      'pending', // paymentStatus
      null, // paymentMethod
      null, // pdfUrl
      request.notes || null,
    );

    // Guardar la factura
    let savedInvoice = await this.invoiceRepository.save(invoice);

    // Generar PDF y actualizar la factura con la URL
    try {
      const pdfUrl = await this.invoicePdfService.generateAndUploadInvoicePdf(savedInvoice);
      const invoiceWithPdf = new Invoice(
        savedInvoice.id,
        savedInvoice.invoiceNumber,
        savedInvoice.subscriptionId,
        savedInvoice.partnerId,
        savedInvoice.billingCycleId,
        savedInvoice.businessName,
        savedInvoice.taxId,
        savedInvoice.fiscalAddress,
        savedInvoice.billingEmail,
        savedInvoice.issueDate,
        savedInvoice.dueDate,
        savedInvoice.paidDate,
        savedInvoice.subtotal,
        savedInvoice.discountAmount,
        savedInvoice.taxAmount,
        savedInvoice.creditApplied,
        savedInvoice.total,
        savedInvoice.currency,
        savedInvoice.items,
        savedInvoice.status,
        savedInvoice.paymentStatus,
        savedInvoice.paymentMethod,
        pdfUrl,
        savedInvoice.notes,
        savedInvoice.createdAt,
        new Date(),
      );
      await this.invoiceRepository.update(invoiceWithPdf);
      savedInvoice = invoiceWithPdf;
    } catch (error) {
      // Log error pero no fallar la creación de la factura
      console.error('Error generating PDF:', error);
    }

    // Enviar email al partner
    try {
      await this.emailService.sendInvoiceGeneratedEmail(
        savedInvoice,
        partner.billingEmail,
        savedInvoice.pdfUrl || undefined,
      );
    } catch (error) {
      // Log error pero no fallar la creación de la factura
      console.error('Error sending email:', error);
    }

    // Si hay billingCycle, actualizarlo con la información de la factura
    if (billingCycle) {
      // Obtener el billing cycle actualizado después de aplicar pagos (si se aplicaron)
      // Esto asegura que tenemos el paidAmount más reciente
      const currentBillingCycle = await this.billingCycleRepository.findById(billingCycle.id);
      const billingCycleToUse = currentBillingCycle || billingCycle;

      // Actualizar el totalAmount del billing cycle para que coincida con el total de la factura
      // El billing cycle puede haberse creado sin impuestos, pero la factura los incluye
      const updatedTotalAmount = savedInvoice.total;

      // Verificar si el billing cycle ya está completamente pagado
      // Si es así, la factura también debe marcarse como pagada
      const isBillingCyclePaid = billingCycleToUse.paidAmount >= updatedTotalAmount - 0.01;

      // Si el billing cycle está pagado, marcar la factura como pagada también
      if (isBillingCyclePaid && savedInvoice.status === 'pending') {
        const paymentMethod: InvoicePaymentMethod = billingCycleToUse.paymentMethod
          ? (billingCycleToUse.paymentMethod as InvoicePaymentMethod)
          : 'bank_transfer';
        const paidInvoice = savedInvoice.markAsPaid(
          paymentMethod,
          billingCycleToUse.paymentDate || new Date(),
        );
        await this.invoiceRepository.update(paidInvoice);
        savedInvoice = paidInvoice;
      }

      // Determinar el invoiceStatus basado en el estado actual de la factura (después de posibles actualizaciones)
      // Re-fetch la factura para asegurarnos de tener el estado más reciente
      const finalInvoice = await this.invoiceRepository.findById(savedInvoice.id);
      const invoiceToUse = finalInvoice || savedInvoice;
      const invoiceStatus = invoiceToUse.status === 'paid' ? 'paid' : 'pending';

      const updatedCycle = new BillingCycle(
        billingCycleToUse.id,
        billingCycleToUse.subscriptionId,
        billingCycleToUse.partnerId,
        billingCycleToUse.cycleNumber,
        billingCycleToUse.startDate,
        billingCycleToUse.endDate,
        billingCycleToUse.durationDays,
        billingCycleToUse.billingDate,
        billingCycleToUse.dueDate,
        billingCycleToUse.amount,
        billingCycleToUse.paidAmount,
        billingCycleToUse.currency,
        billingCycleToUse.status,
        billingCycleToUse.paymentStatus,
        billingCycleToUse.paymentDate,
        billingCycleToUse.paymentMethod,
        invoiceToUse.id.toString(),
        invoiceToUse.invoiceNumber,
        invoiceStatus, // Usar el estado correcto basado en el estado actual de la factura
        billingCycleToUse.discountApplied,
        updatedTotalAmount, // Actualizar totalAmount para que coincida con el total de la factura
        billingCycleToUse.createdAt,
        new Date(),
      );
      await this.billingCycleRepository.update(updatedCycle);
    }

    // Convertir items a response format
    const itemsResponse: InvoiceItemResponse[] = savedInvoice.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      discountPercent: item.discountPercent,
      discountAmount: item.discountAmount,
      total: item.total,
    }));

    // Obtener la factura actualizada (con PDF URL si se generó)
    const finalInvoice = await this.invoiceRepository.findById(savedInvoice.id);
    const invoiceToReturn = finalInvoice || savedInvoice;

    // Retornar response
    return new CreateInvoiceResponse(
      invoiceToReturn.id,
      invoiceToReturn.invoiceNumber,
      invoiceToReturn.subscriptionId,
      invoiceToReturn.partnerId,
      invoiceToReturn.billingCycleId,
      invoiceToReturn.businessName,
      invoiceToReturn.taxId,
      invoiceToReturn.fiscalAddress,
      invoiceToReturn.billingEmail,
      invoiceToReturn.issueDate,
      invoiceToReturn.dueDate,
      invoiceToReturn.paidDate,
      invoiceToReturn.subtotal,
      invoiceToReturn.discountAmount,
      invoiceToReturn.taxAmount,
      invoiceToReturn.creditApplied,
      invoiceToReturn.total,
      invoiceToReturn.currency,
      itemsResponse,
      invoiceToReturn.status,
      invoiceToReturn.paymentStatus,
      invoiceToReturn.paymentMethod,
      invoiceToReturn.pdfUrl,
      invoiceToReturn.notes,
      invoiceToReturn.createdAt,
      invoiceToReturn.updatedAt,
    );
  }

  /**
   * Genera un número de factura único con formato INV-{YEAR}-{SEQUENCE}
   * Ejemplo: INV-2024-001
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    // Buscar todas las facturas del año actual usando una consulta directa
    const currentYearInvoices = await this.invoiceEntityRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('invoice.invoiceNumber', 'DESC')
      .getMany();

    let sequence = 1;
    if (currentYearInvoices.length > 0) {
      // Extraer el número de secuencia más alto
      const sequences = currentYearInvoices
        .map((inv) => {
          const match = inv.invoiceNumber.match(new RegExp(`${prefix}(\\d+)`));
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => n > 0);

      if (sequences.length > 0) {
        sequence = Math.max(...sequences) + 1;
      }
    }

    // Formatear con padding de 3 dígitos
    const invoiceNumber = `${prefix}${sequence.toString().padStart(3, '0')}`;

    // Verificar unicidad (por si acaso hay race condition)
    const existing = await this.invoiceRepository.findByInvoiceNumber(invoiceNumber);
    if (existing) {
      // Si existe, incrementar y reintentar
      sequence++;
      return `${prefix}${sequence.toString().padStart(3, '0')}`;
    }

    return invoiceNumber;
  }
}
