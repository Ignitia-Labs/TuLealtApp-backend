import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  IPartnerStaffAssignmentRepository,
} from '@libs/domain';
import { DeletePartnerStaffAssignmentRequest } from './delete-partner-staff-assignment.request';

/**
 * Handler para el caso de uso de eliminar una asignación staff-partner
 */
@Injectable()
export class DeletePartnerStaffAssignmentHandler {
  constructor(
    @Inject('IPartnerStaffAssignmentRepository')
    private readonly assignmentRepository: IPartnerStaffAssignmentRepository,
  ) {}

  async execute(
    request: DeletePartnerStaffAssignmentRequest,
  ): Promise<void> {
    // Verificar que la asignación existe
    const assignment = await this.assignmentRepository.findById(request.id);

    if (!assignment) {
      throw new NotFoundException(
        `Partner staff assignment with ID ${request.id} not found`,
      );
    }

    // Eliminar la asignación
    await this.assignmentRepository.delete(request.id);
  }
}

