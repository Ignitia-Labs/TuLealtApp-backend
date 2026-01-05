import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IPartnerStaffAssignmentRepository, PartnerStaffAssignment } from '@libs/domain';

/**
 * Servicio para validaciones y lógica de negocio de asignaciones staff-partner
 */
@Injectable()
export class PartnerStaffAssignmentService {
  constructor(
    @Inject('IPartnerStaffAssignmentRepository')
    private readonly assignmentRepository: IPartnerStaffAssignmentRepository,
  ) {}

  /**
   * Validar que la suma de porcentajes no exceda 100%
   */
  async validateTotalCommissionPercent(
    partnerId: number,
    newPercent: number,
    excludeId?: number,
  ): Promise<void> {
    const currentTotal = await this.assignmentRepository.getTotalCommissionPercent(
      partnerId,
      excludeId,
    );

    const newTotal = currentTotal + newPercent;

    if (newTotal > 100) {
      throw new BadRequestException(
        `La suma de porcentajes de comisión no puede exceder 100%. Actual: ${currentTotal}%, Nuevo: ${newPercent}%, Total: ${newTotal}%`,
      );
    }
  }

  /**
   * Validar solapamiento de fechas con otras asignaciones activas
   */
  async validateDateOverlap(
    partnerId: number,
    staffUserId: number,
    startDate: Date,
    endDate: Date | null,
    excludeId?: number,
  ): Promise<void> {
    // Obtener todas las asignaciones activas del mismo partner-staff
    const existingAssignments = await this.assignmentRepository.findByStaffUserId(
      staffUserId,
      true,
    );

    // Filtrar solo las del mismo partner y que estén activas
    const relevantAssignments = existingAssignments.filter(
      (assignment) =>
        assignment.partnerId === partnerId &&
        assignment.isActive &&
        (!excludeId || assignment.id !== excludeId),
    );

    if (relevantAssignments.length === 0) {
      return; // No hay asignaciones existentes, no hay solapamiento
    }

    // Verificar solapamiento con cada asignación existente
    const newAssignment = PartnerStaffAssignment.create(
      partnerId,
      staffUserId,
      0, // porcentaje temporal, no importa para validar fechas
      startDate,
      endDate,
    );

    for (const existingAssignment of relevantAssignments) {
      if (newAssignment.overlapsWith(existingAssignment)) {
        throw new BadRequestException(
          'Ya existe una asignación activa con fechas solapadas para este partner y staff',
        );
      }
    }
  }

  /**
   * Obtener asignaciones activas para un partner en una fecha específica
   */
  async getActiveAssignmentsForDate(
    partnerId: number,
    date: Date,
  ): Promise<PartnerStaffAssignment[]> {
    return this.assignmentRepository.findActiveAssignmentsByDate(partnerId, date);
  }
}
