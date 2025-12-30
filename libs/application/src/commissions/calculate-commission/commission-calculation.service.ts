import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IPartnerStaffAssignmentRepository,
  ICommissionRepository,
  IPaymentRepository,
  Payment,
  Commission,
  BillingCycle,
} from '@libs/domain';

/**
 * Servicio para calcular comisiones automáticamente cuando se procesa un pago o billing cycle
 */
@Injectable()
export class CommissionCalculationService {
  private readonly logger = new Logger(CommissionCalculationService.name);

  constructor(
    @Inject('IPartnerStaffAssignmentRepository')
    private readonly assignmentRepository: IPartnerStaffAssignmentRepository,
    @Inject('ICommissionRepository')
    private readonly commissionRepository: ICommissionRepository,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  /**
   * Calcular y crear comisiones para un pago
   * Se ejecuta automáticamente cuando un pago es marcado como 'paid'
   */
  async calculateCommissionsForPayment(
    payment: Payment,
    partnerId: number,
    subscriptionId: number,
  ): Promise<Commission[]> {
    try {
      // 1. Obtener asignaciones activas del partner en la fecha del pago
      const assignments =
        await this.assignmentRepository.findActiveAssignmentsByDate(
          partnerId,
          payment.paymentDate,
        );

      if (assignments.length === 0) {
        // No hay asignaciones, no se generan comisiones
        this.logger.log(
          `No active assignments found for partner ${partnerId} on ${payment.paymentDate.toISOString()}`,
        );
        return [];
      }

      // 2. Verificar que no existan comisiones ya creadas para este pago
      const existingCommissions =
        await this.commissionRepository.findByPaymentId(payment.id);

      if (existingCommissions.length > 0) {
        this.logger.warn(
          `Commissions already exist for payment ${payment.id}. Skipping calculation.`,
        );
        return existingCommissions;
      }

      // 3. Calcular comisión para cada asignación
      // Si el pago tiene billingCycleId, usarlo; si no, usar solo paymentId
      const commissions: Commission[] = [];

      for (const assignment of assignments) {
        const commissionAmount = this.calculateCommissionAmount(
          payment.amount,
          assignment.commissionPercent,
        );

        const commission = Commission.create(
          partnerId,
          assignment.staffUserId,
          payment.id, // Mantener paymentId para referencia
          subscriptionId,
          assignment.id,
          payment.amount,
          assignment.commissionPercent,
          payment.currency,
          payment.paymentDate,
          null, // notes
          undefined, // id (se generará automáticamente)
          payment.billingCycleId ?? null, // Usar billingCycleId si el pago lo tiene
        );

        commissions.push(commission);

        this.logger.log(
          `Calculated commission for staff ${assignment.staffUserId}: ${commissionAmount} ${payment.currency} (${assignment.commissionPercent}% of ${payment.amount})${payment.billingCycleId ? ` for billing cycle ${payment.billingCycleId}` : ''}`,
        );
      }

      // 4. Guardar todas las comisiones
      const savedCommissions =
        await this.commissionRepository.saveMany(commissions);

      this.logger.log(
        `Created ${savedCommissions.length} commissions for payment ${payment.id}`,
      );

      return savedCommissions;
    } catch (error) {
      this.logger.error(
        `Error calculating commissions for payment ${payment.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Calcular y crear comisiones para un billing cycle cuando se marca como 'paid'
   * Se ejecuta automáticamente cuando un billing cycle es marcado como 'paid'
   */
  async calculateCommissionsForBillingCycle(
    billingCycle: BillingCycle,
  ): Promise<Commission[]> {
    try {
      // 1. Verificar que el billing cycle esté pagado
      if (billingCycle.status !== 'paid' && billingCycle.paymentStatus !== 'paid') {
        this.logger.log(
          `Billing cycle ${billingCycle.id} is not paid. Status: ${billingCycle.status}, PaymentStatus: ${billingCycle.paymentStatus}. Skipping commission calculation.`,
        );
        return [];
      }

      // 2. Obtener todos los pagos asociados al billing cycle
      const cyclePayments = await this.paymentRepository.findByBillingCycleId(
        billingCycle.id,
      );

      if (cyclePayments.length === 0) {
        this.logger.warn(
          `No payments found for billing cycle ${billingCycle.id}. Cannot calculate commissions.`,
        );
        return [];
      }

      // 3. Verificar si ya existen comisiones para este billing cycle
      // Usar findByBillingCycleId para verificación directa (más eficiente)
      const existingCommissions =
        await this.commissionRepository.findByBillingCycleId(billingCycle.id);

      if (existingCommissions.length > 0) {
        this.logger.log(
          `Commissions already exist for billing cycle ${billingCycle.id}. Found ${existingCommissions.length} commission(s). Skipping calculation to avoid duplicates.`,
        );
        return existingCommissions;
      }

      // 4. Obtener asignaciones activas del partner en la fecha del billing cycle
      // Usar paymentDate del billing cycle, o si no existe, usar la fecha del primer pago
      const paymentDate =
        billingCycle.paymentDate ||
        cyclePayments.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())[0]
          .paymentDate;

      const assignments =
        await this.assignmentRepository.findActiveAssignmentsByDate(
          billingCycle.partnerId,
          paymentDate,
        );

      if (assignments.length === 0) {
        this.logger.log(
          `No active assignments found for partner ${billingCycle.partnerId} on ${paymentDate.toISOString()}. Cannot calculate commissions for billing cycle ${billingCycle.id}.`,
        );
        return [];
      }

      // 5. Calcular comisión para cada asignación basada en el totalAmount del billing cycle
      const commissions: Commission[] = [];

      // Usar el primer pago del ciclo como referencia (opcional, para mantener compatibilidad)
      // Pero la comisión se asocia principalmente al billingCycleId
      const referencePayment = cyclePayments.sort(
        (a, b) => a.paymentDate.getTime() - b.paymentDate.getTime(),
      )[0];

      for (const assignment of assignments) {
        const commissionAmount = this.calculateCommissionAmount(
          billingCycle.totalAmount,
          assignment.commissionPercent,
        );

        const commission = Commission.create(
          billingCycle.partnerId,
          assignment.staffUserId,
          referencePayment.id, // Mantener referencia al pago para compatibilidad
          billingCycle.subscriptionId,
          assignment.id,
          billingCycle.totalAmount, // Usar el totalAmount del billing cycle
          assignment.commissionPercent,
          billingCycle.currency,
          paymentDate,
          `Comisión generada por billing cycle ${billingCycle.cycleNumber} (ID: ${billingCycle.id})`,
          undefined, // id (se generará automáticamente)
          billingCycle.id, // billingCycleId - Campo principal de asociación
        );

        commissions.push(commission);

        this.logger.log(
          `Calculated commission for staff ${assignment.staffUserId}: ${commissionAmount} ${billingCycle.currency} (${assignment.commissionPercent}% of ${billingCycle.totalAmount}) for billing cycle ${billingCycle.id}`,
        );
      }

      // 6. Guardar todas las comisiones
      const savedCommissions =
        await this.commissionRepository.saveMany(commissions);

      this.logger.log(
        `Created ${savedCommissions.length} commissions for billing cycle ${billingCycle.id}`,
      );

      return savedCommissions;
    } catch (error) {
      this.logger.error(
        `Error calculating commissions for billing cycle ${billingCycle.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Calcular el monto de comisión basado en el monto del pago y el porcentaje
   */
  private calculateCommissionAmount(
    paymentAmount: number,
    commissionPercent: number,
  ): number {
    return (paymentAmount * commissionPercent) / 100;
  }
}

