import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IPartnerStaffAssignmentRepository,
  ICommissionRepository,
  Payment,
  Commission,
} from '@libs/domain';

/**
 * Servicio para calcular comisiones automáticamente cuando se procesa un pago
 */
@Injectable()
export class CommissionCalculationService {
  private readonly logger = new Logger(CommissionCalculationService.name);

  constructor(
    @Inject('IPartnerStaffAssignmentRepository')
    private readonly assignmentRepository: IPartnerStaffAssignmentRepository,
    @Inject('ICommissionRepository')
    private readonly commissionRepository: ICommissionRepository,
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
      const commissions: Commission[] = [];

      for (const assignment of assignments) {
        const commissionAmount = this.calculateCommissionAmount(
          payment.amount,
          assignment.commissionPercent,
        );

        const commission = Commission.create(
          partnerId,
          assignment.staffUserId,
          payment.id,
          subscriptionId,
          assignment.id,
          payment.amount,
          assignment.commissionPercent,
          payment.currency,
          payment.paymentDate,
        );

        commissions.push(commission);

        this.logger.log(
          `Calculated commission for staff ${assignment.staffUserId}: ${commissionAmount} ${payment.currency} (${assignment.commissionPercent}% of ${payment.amount})`,
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
   * Calcular el monto de comisión basado en el monto del pago y el porcentaje
   */
  private calculateCommissionAmount(
    paymentAmount: number,
    commissionPercent: number,
  ): number {
    return (paymentAmount * commissionPercent) / 100;
  }
}

