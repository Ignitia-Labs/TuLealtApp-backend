import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IBillingCycleRepository,
  IPartnerRepository,
  ICurrencyRepository,
  ISubscriptionEventRepository,
  BillingCycle,
} from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper } from '@libs/infrastructure';
import { registerSubscriptionEvent } from '@libs/shared';
import { CreateBillingCycleRequest } from './create-billing-cycle.request';
import { CreateBillingCycleResponse } from './create-billing-cycle.response';

/**
 * Handler para el caso de uso de crear un ciclo de facturación
 */
@Injectable()
export class CreateBillingCycleHandler {
  constructor(
    @Inject('IBillingCycleRepository')
    private readonly billingCycleRepository: IBillingCycleRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ICurrencyRepository')
    private readonly currencyRepository: ICurrencyRepository,
    @Inject('ISubscriptionEventRepository')
    private readonly subscriptionEventRepository: ISubscriptionEventRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(request: CreateBillingCycleRequest): Promise<CreateBillingCycleResponse> {
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

    // Validar fechas
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const billingDate = new Date(request.billingDate);
    const dueDate = new Date(request.dueDate);

    if (startDate >= endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    if (dueDate < billingDate) {
      throw new BadRequestException('dueDate must be after or equal to billingDate');
    }

    // Calcular duración en días
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Obtener el último ciclo para calcular el número de ciclo
    const existingCycles = await this.billingCycleRepository.findBySubscriptionId(
      request.subscriptionId,
    );
    const cycleNumber =
      existingCycles.length > 0 ? Math.max(...existingCycles.map((c) => c.cycleNumber)) + 1 : 1;

    // Calcular montos
    const amount = request.amount;
    const discountApplied = request.discountApplied || 0;
    const totalAmount = amount - discountApplied;

    if (totalAmount < 0) {
      throw new BadRequestException('Total amount cannot be negative after discount');
    }

    // Crear el ciclo de facturación
    const billingCycle = BillingCycle.create(
      request.subscriptionId,
      subscription.partnerId,
      cycleNumber,
      startDate,
      endDate,
      billingDate,
      dueDate,
      amount,
      request.currency || subscription.currency,
      durationDays,
      totalAmount,
      0, // paidAmount inicial
      'pending', // status
      'pending', // paymentStatus
      null, // paymentDate
      null, // paymentMethod
      null, // invoiceId (se asignará cuando se cree la factura)
      null, // invoiceNumber
      null, // invoiceStatus
      discountApplied > 0 ? discountApplied : null,
    );

    // Guardar el ciclo
    const savedCycle = await this.billingCycleRepository.save(billingCycle);

    // Registrar evento de suscripción para ciclo de facturación creado
    try {
      await registerSubscriptionEvent(
        {
          type: 'custom',
          subscription,
          title: 'Ciclo de facturación creado',
          description: `Se creó el ciclo de facturación #${savedCycle.cycleNumber} por un monto de ${savedCycle.totalAmount} ${savedCycle.currency}`,
          metadata: {
            cycleNumber: savedCycle.cycleNumber,
            totalAmount: savedCycle.totalAmount,
            amount: savedCycle.amount,
            discountApplied: savedCycle.discountApplied,
            currency: savedCycle.currency,
            startDate: savedCycle.startDate,
            endDate: savedCycle.endDate,
            billingDate: savedCycle.billingDate,
            dueDate: savedCycle.dueDate,
            durationDays: savedCycle.durationDays,
          },
        },
        this.subscriptionEventRepository,
      );
    } catch (error) {
      // Log error pero no fallar la creación del ciclo
      console.error('Error registering subscription event for created billing cycle:', error);
    }

    // Obtener información de la moneda
    const currencyCode = request.currency || subscription.currency;
    const currency = await this.currencyRepository.findByCode(currencyCode);
    const currencyId = currency?.id ?? null;
    const currencyLabel = currency?.name ?? null;

    // Retornar response
    return new CreateBillingCycleResponse(
      savedCycle.id,
      savedCycle.subscriptionId,
      savedCycle.partnerId,
      savedCycle.cycleNumber,
      savedCycle.startDate,
      savedCycle.endDate,
      savedCycle.durationDays,
      savedCycle.billingDate,
      savedCycle.dueDate,
      savedCycle.amount,
      savedCycle.paidAmount,
      savedCycle.totalAmount,
      savedCycle.currency,
      currencyId,
      currencyLabel,
      savedCycle.status,
      savedCycle.paymentStatus,
      savedCycle.paymentDate,
      savedCycle.paymentMethod,
      savedCycle.invoiceId,
      savedCycle.invoiceNumber,
      savedCycle.invoiceStatus,
      savedCycle.discountApplied,
      savedCycle.createdAt,
      savedCycle.updatedAt,
    );
  }
}
