import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IInvoiceRepository,
  IBillingCycleRepository,
  IPartnerRepository,
  Invoice,
  InvoiceItem,
  BillingCycle,
} from '@libs/domain';
import {
  PartnerSubscriptionEntity,
  PartnerMapper,
  InvoiceEntity,
  InvoicePdfService,
  EmailService,
} from '@libs/infrastructure';
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
    const processedItems: InvoiceItem[] = [];
    let subtotal = 0;
    let totalTaxAmount = 0;

    for (const item of request.items) {
      const amount = item.quantity * item.unitPrice;
      const taxRate = item.taxRate || 0;
      const taxAmount = amount * (taxRate / 100);
      const discountPercent = item.discountPercent || 0;
      const discountAmount = amount * (discountPercent / 100);
      const itemTotal = amount + taxAmount - discountAmount;

      processedItems.push({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount,
        taxRate,
        taxAmount,
        discountPercent: discountPercent > 0 ? discountPercent : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        total: itemTotal,
      });

      subtotal += amount;
      totalTaxAmount += taxAmount;
    }

    // Aplicar descuento total si se proporciona
    const discountAmount = request.discountAmount || 0;
    const creditApplied = request.creditApplied || 0;
    const total = subtotal + totalTaxAmount - discountAmount - creditApplied;

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
      subtotal,
      totalTaxAmount,
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
      const updatedCycle = new BillingCycle(
        billingCycle.id,
        billingCycle.subscriptionId,
        billingCycle.partnerId,
        billingCycle.cycleNumber,
        billingCycle.startDate,
        billingCycle.endDate,
        billingCycle.durationDays,
        billingCycle.billingDate,
        billingCycle.dueDate,
        billingCycle.amount,
        billingCycle.paidAmount,
        billingCycle.currency,
        billingCycle.status,
        billingCycle.paymentStatus,
        billingCycle.paymentDate,
        billingCycle.paymentMethod,
        savedInvoice.id.toString(),
        savedInvoice.invoiceNumber,
        'pending',
        billingCycle.discountApplied,
        billingCycle.totalAmount,
        billingCycle.createdAt,
        new Date(),
      );
      await this.billingCycleRepository.update(updatedCycle);
    }

    // Convertir items a response format
    const itemsResponse: InvoiceItemResponse[] = savedInvoice.items.map(item => ({
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
        .map(inv => {
          const match = inv.invoiceNumber.match(new RegExp(`${prefix}(\\d+)`));
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);

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

