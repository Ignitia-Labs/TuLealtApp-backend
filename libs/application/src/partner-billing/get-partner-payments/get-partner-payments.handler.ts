import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IPaymentRepository, ICurrencyRepository } from '@libs/domain';
import { GetPartnerPaymentsRequest } from './get-partner-payments.request';
import { GetPartnerPaymentsResponse, PaymentDto } from './get-partner-payments.response';

/**
 * Handler para obtener el historial de pagos del partner
 * Soporta paginación o retornar todos los registros
 */
@Injectable()
export class GetPartnerPaymentsHandler {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('ICurrencyRepository')
    private readonly currencyRepository: ICurrencyRepository,
  ) {}

  async execute(request: GetPartnerPaymentsRequest): Promise<GetPartnerPaymentsResponse> {
    // Si all=true, verificar límite de registros
    if (request.all === true) {
      return this.executeWithoutPagination(request);
    }

    // Lógica con paginación
    return this.executeWithPagination(request);
  }

  private async executeWithoutPagination(
    request: GetPartnerPaymentsRequest,
  ): Promise<GetPartnerPaymentsResponse> {
    // Contar registros primero
    const total = await this.paymentRepository.countByPartnerId(request.partnerId, request.status);

    // Validar límite máximo de 1000 registros
    if (total > 1000) {
      throw new BadRequestException(
        `Too many records (${total}). Please use pagination with limit max 100`,
      );
    }

    // Obtener todos los pagos sin paginación
    const payments = await this.paymentRepository.findByPartnerId(
      request.partnerId,
      request.status,
      null, // no page
      null, // no limit
      false, // no incluir derivados por defecto
    );

    // Mapear a DTOs
    const paymentDtos = await Promise.all(payments.map((payment) => this.mapPaymentToDto(payment)));

    return new GetPartnerPaymentsResponse(
      paymentDtos,
      total,
      null, // page null cuando all=true
      null, // limit null cuando all=true
      null, // totalPages null cuando all=true
    );
  }

  private async executeWithPagination(
    request: GetPartnerPaymentsRequest,
  ): Promise<GetPartnerPaymentsResponse> {
    const page = request.page || 1;
    const limit = request.limit || 10;

    // Contar total de registros
    const total = await this.paymentRepository.countByPartnerId(request.partnerId, request.status);

    // Calcular total de páginas
    const totalPages = Math.ceil(total / limit);

    // Obtener pagos con paginación
    const payments = await this.paymentRepository.findByPartnerId(
      request.partnerId,
      request.status,
      page,
      limit,
      false, // no incluir derivados por defecto
    );

    // Mapear a DTOs
    const paymentDtos = await Promise.all(payments.map((payment) => this.mapPaymentToDto(payment)));

    // Calcular navegación
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return new GetPartnerPaymentsResponse(
      paymentDtos,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    );
  }

  private async mapPaymentToDto(payment: any): Promise<PaymentDto> {
    // Obtener información de la moneda
    const currency = await this.currencyRepository.findByCode(payment.currency);

    const dto = new PaymentDto();
    dto.id = payment.id;
    dto.subscriptionId = payment.subscriptionId;
    dto.partnerId = payment.partnerId;
    dto.amount = payment.amount;
    dto.currency = payment.currency;
    dto.currencyId = currency?.id ?? null;
    dto.currencyLabel = currency?.name ?? null;
    dto.paymentMethod = payment.paymentMethod;
    dto.status = payment.status;
    dto.paymentDate = payment.paymentDate;
    dto.processedDate = payment.processedDate;
    dto.invoiceNumber = null; // Se puede obtener de la relación si existe
    dto.billingCycleId = payment.billingCycleId;
    dto.reference = payment.reference;
    dto.confirmationCode = payment.confirmationCode;
    dto.gateway = payment.gateway;
    dto.gatewayTransactionId = payment.gatewayTransactionId;
    dto.cardLastFour = payment.cardLastFour;
    dto.cardBrand = payment.cardBrand;
    dto.createdAt = payment.createdAt;

    return dto;
  }
}
