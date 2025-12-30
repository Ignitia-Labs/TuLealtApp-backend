import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  IPartnerStaffAssignmentRepository,
  PartnerStaffAssignment,
} from '@libs/domain';
import { UpdatePartnerStaffAssignmentRequest } from './update-partner-staff-assignment.request';
import { UpdatePartnerStaffAssignmentResponse } from './update-partner-staff-assignment.response';
import { PartnerStaffAssignmentService } from '../partner-staff-assignment.service';

/**
 * Handler para el caso de uso de actualizar una asignación staff-partner
 */
@Injectable()
export class UpdatePartnerStaffAssignmentHandler {
  constructor(
    @Inject('IPartnerStaffAssignmentRepository')
    private readonly assignmentRepository: IPartnerStaffAssignmentRepository,
    private readonly assignmentService: PartnerStaffAssignmentService,
  ) {}

  async execute(
    id: number,
    request: UpdatePartnerStaffAssignmentRequest,
  ): Promise<UpdatePartnerStaffAssignmentResponse> {
    // Buscar la asignación existente
    const existingAssignment = await this.assignmentRepository.findById(id);

    if (!existingAssignment) {
      throw new NotFoundException(
        `Partner staff assignment with ID ${id} not found`,
      );
    }

    let updatedAssignment: PartnerStaffAssignment = existingAssignment;

    // Actualizar porcentaje de comisión si se proporciona
    if (request.commissionPercent !== undefined) {
      // Validar que la suma de porcentajes no exceda 100%
      await this.assignmentService.validateTotalCommissionPercent(
        existingAssignment.partnerId,
        request.commissionPercent,
        id, // Excluir la asignación actual del cálculo
      );

      updatedAssignment = updatedAssignment.updateCommissionPercent(
        request.commissionPercent,
        request.notes || null,
      );
    }

    // Actualizar fechas si se proporcionan
    if (request.startDate !== undefined || request.endDate !== undefined) {
      const startDate = request.startDate
        ? new Date(request.startDate)
        : existingAssignment.startDate;
      const endDate =
        request.endDate !== undefined
          ? request.endDate
            ? new Date(request.endDate)
            : null
          : existingAssignment.endDate;

      if (endDate && startDate >= endDate) {
        throw new BadRequestException('startDate must be before endDate');
      }

      // Validar solapamiento de fechas
      await this.assignmentService.validateDateOverlap(
        existingAssignment.partnerId,
        existingAssignment.staffUserId,
        startDate,
        endDate,
        id, // Excluir la asignación actual
      );

      updatedAssignment = updatedAssignment.updateDates(
        startDate,
        endDate,
        request.notes || null,
      );
    }

    // Actualizar estado activo si se proporciona
    if (request.isActive !== undefined) {
      updatedAssignment = request.isActive
        ? updatedAssignment.activate()
        : updatedAssignment.deactivate();
    }

    // Actualizar notas si se proporcionan y no se actualizó en otros campos
    if (
      request.notes !== undefined &&
      request.commissionPercent === undefined &&
      request.startDate === undefined &&
      request.endDate === undefined
    ) {
      updatedAssignment = PartnerStaffAssignment.create(
        updatedAssignment.partnerId,
        updatedAssignment.staffUserId,
        updatedAssignment.commissionPercent,
        updatedAssignment.startDate,
        updatedAssignment.endDate,
        request.notes,
        updatedAssignment.isActive,
        updatedAssignment.id,
      );
    }

    // Guardar la asignación actualizada
    const savedAssignment =
      await this.assignmentRepository.update(updatedAssignment);

    return new UpdatePartnerStaffAssignmentResponse(
      savedAssignment.id,
      savedAssignment.partnerId,
      savedAssignment.staffUserId,
      savedAssignment.commissionPercent,
      savedAssignment.isActive,
      savedAssignment.startDate,
      savedAssignment.endDate,
      savedAssignment.notes,
      savedAssignment.updatedAt,
    );
  }
}

