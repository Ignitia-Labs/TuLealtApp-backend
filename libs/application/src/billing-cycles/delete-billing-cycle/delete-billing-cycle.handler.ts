import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IBillingCycleRepository,
  IInvoiceRepository,
  IPaymentRepository,
  ISubscriptionEventRepository,
} from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerMapper } from '@libs/infrastructure';
import { roundToTwoDecimals, registerSubscriptionEvent } from '@libs/shared';
import { DeleteBillingCycleRequest } from './delete-billing-cycle.request';
import { DeleteBillingCycleResponse } from './delete-billing-cycle.response';

/**
 * Handler para el caso de uso de eliminar un ciclo de facturación
 * También elimina la factura asociada si existe, los payments derivados asociados,
 * y revierte el crédito aplicado en la suscripción
 */
@Injectable()
export class DeleteBillingCycleHandler {
  private readonly logger = new Logger(DeleteBillingCycleHandler.name);

  constructor(
    @Inject('IBillingCycleRepository')
    private readonly billingCycleRepository: IBillingCycleRepository,
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('ISubscriptionEventRepository')
    private readonly subscriptionEventRepository: ISubscriptionEventRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(request: DeleteBillingCycleRequest): Promise<DeleteBillingCycleResponse> {
    const billingCycle = await this.billingCycleRepository.findById(request.billingCycleId);

    if (!billingCycle) {
      throw new NotFoundException(`Billing cycle with ID ${request.billingCycleId} not found`);
    }

    // 1. Buscar la factura asociada para obtener el crédito aplicado (antes de eliminarla)
    const invoice = await this.invoiceRepository.findByBillingCycleId(request.billingCycleId);
    const creditApplied = invoice?.creditApplied || 0;

    // 2. Buscar todos los payments derivados asociados al billing cycle
    const derivedPayments = await this.paymentRepository.findByBillingCycleId(
      request.billingCycleId,
    );

    this.logger.log(
      `Encontrados ${derivedPayments.length} payments derivados asociados al billing cycle ${request.billingCycleId}`,
    );

    // 3. Eliminar los payments derivados ANTES de eliminar el billing cycle
    // Esto es crítico porque si eliminamos el billing cycle primero, TypeORM
    // automáticamente pondrá billingCycleId en null debido a onDelete: 'SET NULL'
    for (const payment of derivedPayments) {
      try {
        await this.paymentRepository.delete(payment.id);

        // Verificar que el payment fue eliminado
        const deletedPayment = await this.paymentRepository.findById(payment.id);
        if (deletedPayment) {
          this.logger.error(
            `ERROR: El payment derivado ${payment.id} NO fue eliminado correctamente`,
          );
          throw new Error(
            `Failed to delete derived payment ${payment.id} associated with billing cycle ${request.billingCycleId}`,
          );
        }

        this.logger.log(
          `Payment derivado ${payment.id} (monto: ${payment.amount} ${payment.currency}) eliminado exitosamente (asociado al billing cycle ${request.billingCycleId})`,
        );
      } catch (error) {
        this.logger.error(
          `Error al eliminar payment derivado ${payment.id}: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }

    // 4. Log sobre el crédito revertido (ya no actualizamos el creditBalance almacenado)
    // NOTA: El crédito se calcula dinámicamente cada vez que se necesita, por lo que no es necesario
    // actualizar el valor almacenado. Al eliminar los payments derivados, el crédito disponible
    // se recalculará automáticamente la próxima vez que se consulte.
    if (creditApplied > 0) {
      const subscriptionEntity = await this.subscriptionRepository.findOne({
        where: { id: billingCycle.subscriptionId },
      });

      if (subscriptionEntity) {
        const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);
        this.logger.log(
          `Crédito de ${creditApplied} ${subscription.currency} revertido al eliminar billing cycle ${request.billingCycleId}. ` +
          `El crédito disponible se recalculará dinámicamente la próxima vez que se consulte la suscripción ${subscription.id}.`,
        );
      } else {
        this.logger.warn(
          `No se encontró la suscripción ${billingCycle.subscriptionId} para registrar la reversión del crédito aplicado`,
        );
      }
    }

    // 5. Eliminar la factura asociada si existe
    if (invoice) {
      await this.invoiceRepository.delete(invoice.id);
      this.logger.log(`Factura ${invoice.id} eliminada (asociada al billing cycle ${request.billingCycleId})`);
    }

    // 6. Obtener la suscripción para registrar el evento antes de eliminar
    const subscriptionEntity = await this.subscriptionRepository.findOne({
      where: { id: billingCycle.subscriptionId },
    });

    // 7. Eliminar el ciclo de facturación
    await this.billingCycleRepository.delete(request.billingCycleId);

    this.logger.log(
      `Billing cycle ${request.billingCycleId} eliminado exitosamente. Payments derivados eliminados: ${derivedPayments.length}, Crédito revertido: ${creditApplied}`,
    );

    // Registrar evento de suscripción para ciclo de facturación eliminado
    if (subscriptionEntity) {
      try {
        const subscription = PartnerMapper.subscriptionToDomain(subscriptionEntity);
        await registerSubscriptionEvent(
          {
            type: 'custom',
            subscription,
            title: 'Ciclo de facturación eliminado',
            description: `Se eliminó el ciclo de facturación #${billingCycle.cycleNumber} por un monto de ${billingCycle.totalAmount} ${billingCycle.currency}. Payments derivados eliminados: ${derivedPayments.length}`,
            metadata: {
              cycleNumber: billingCycle.cycleNumber,
              totalAmount: billingCycle.totalAmount,
              amount: billingCycle.amount,
              paidAmount: billingCycle.paidAmount,
              discountApplied: billingCycle.discountApplied,
              currency: billingCycle.currency,
              status: billingCycle.status,
              paymentStatus: billingCycle.paymentStatus,
              derivedPaymentsDeleted: derivedPayments.length,
              creditReverted: creditApplied,
            },
          },
          this.subscriptionEventRepository,
        );
      } catch (error) {
        // Log error pero no fallar el proceso de eliminación
        this.logger.error('Error registering subscription event for deleted billing cycle:', error);
      }
    }

    return new DeleteBillingCycleResponse(
      request.billingCycleId,
      'Billing cycle deleted successfully',
    );
  }
}

