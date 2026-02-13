import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IInvoiceRepository, ICurrencyRepository } from '@libs/domain';
import { GetPartnerInvoicesRequest } from './get-partner-invoices.request';
import { GetPartnerInvoicesResponse, InvoiceDto } from './get-partner-invoices.response';

/**
 * Handler para obtener el historial de facturas del partner
 * Soporta paginación o retornar todos los registros
 */
@Injectable()
export class GetPartnerInvoicesHandler {
  constructor(
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('ICurrencyRepository')
    private readonly currencyRepository: ICurrencyRepository,
  ) {}

  async execute(request: GetPartnerInvoicesRequest): Promise<GetPartnerInvoicesResponse> {
    // Si all=true, verificar límite de registros
    if (request.all === true) {
      return this.executeWithoutPagination(request);
    }

    // Lógica con paginación
    return this.executeWithPagination(request);
  }

  private async executeWithoutPagination(
    request: GetPartnerInvoicesRequest,
  ): Promise<GetPartnerInvoicesResponse> {
    // Contar registros primero
    const total = await this.invoiceRepository.countByPartnerId(request.partnerId, request.status);

    // Validar límite máximo de 1000 registros
    if (total > 1000) {
      throw new BadRequestException(
        `Too many records (${total}). Please use pagination with limit max 100`,
      );
    }

    // Obtener todas las facturas sin paginación
    const invoices = await this.invoiceRepository.findByPartnerId(
      request.partnerId,
      request.status,
      null, // no page
      null, // no limit
    );

    // Mapear a DTOs
    const invoiceDtos = await Promise.all(invoices.map((invoice) => this.mapInvoiceToDto(invoice)));

    return new GetPartnerInvoicesResponse(
      invoiceDtos,
      total,
      null, // page null cuando all=true
      null, // limit null cuando all=true
      null, // totalPages null cuando all=true
    );
  }

  private async executeWithPagination(
    request: GetPartnerInvoicesRequest,
  ): Promise<GetPartnerInvoicesResponse> {
    const page = request.page || 1;
    const limit = request.limit || 10;

    // Contar total de registros
    const total = await this.invoiceRepository.countByPartnerId(request.partnerId, request.status);

    // Calcular total de páginas
    const totalPages = Math.ceil(total / limit);

    // Obtener facturas con paginación
    const invoices = await this.invoiceRepository.findByPartnerId(
      request.partnerId,
      request.status,
      page,
      limit,
    );

    // Mapear a DTOs
    const invoiceDtos = await Promise.all(invoices.map((invoice) => this.mapInvoiceToDto(invoice)));

    // Calcular navegación
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return new GetPartnerInvoicesResponse(
      invoiceDtos,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    );
  }

  private async mapInvoiceToDto(invoice: any): Promise<InvoiceDto> {
    // Obtener información de la moneda
    const currency = await this.currencyRepository.findByCode(invoice.currency);

    const now = new Date();
    const isOverdue = invoice.isOverdue();
    const daysOverdue = isOverdue
      ? Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const dto = new InvoiceDto();
    dto.id = invoice.id;
    dto.invoiceNumber = invoice.invoiceNumber;
    dto.subscriptionId = invoice.subscriptionId;
    dto.partnerId = invoice.partnerId;
    dto.billingCycleId = invoice.billingCycleId;
    dto.businessName = invoice.businessName;
    dto.taxId = invoice.taxId;
    dto.fiscalAddress = invoice.fiscalAddress;
    dto.billingEmail = invoice.billingEmail;
    dto.issueDate = invoice.issueDate;
    dto.dueDate = invoice.dueDate;
    dto.paidDate = invoice.paidDate;
    dto.subtotal = invoice.subtotal;
    dto.discountAmount = invoice.discountAmount;
    dto.taxAmount = invoice.taxAmount;
    dto.creditApplied = invoice.creditApplied;
    dto.total = invoice.total;
    dto.currency = invoice.currency;
    dto.currencyId = currency?.id ?? null;
    dto.currencyLabel = currency?.name ?? null;
    dto.status = invoice.status;
    dto.paymentStatus = invoice.paymentStatus;
    dto.pdfUrl = invoice.pdfUrl;
    dto.items = invoice.items;
    dto.isOverdue = isOverdue;
    dto.daysOverdue = daysOverdue;
    dto.createdAt = invoice.createdAt;

    return dto;
  }
}
