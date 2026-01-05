import { Injectable, Inject } from '@nestjs/common';
import {
  IPartnerStaffAssignmentRepository,
  IPartnerRepository,
  IUserRepository,
} from '@libs/domain';
import { GetPartnerStaffAssignmentsRequest } from './get-partner-staff-assignments.request';
import {
  GetPartnerStaffAssignmentsResponse,
  PartnerStaffAssignmentDto,
} from './get-partner-staff-assignments.response';

/**
 * Handler para el caso de uso de obtener asignaciones staff-partner
 */
@Injectable()
export class GetPartnerStaffAssignmentsHandler {
  constructor(
    @Inject('IPartnerStaffAssignmentRepository')
    private readonly assignmentRepository: IPartnerStaffAssignmentRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    request: GetPartnerStaffAssignmentsRequest,
  ): Promise<GetPartnerStaffAssignmentsResponse> {
    let assignments;

    // Obtener asignaciones según los filtros
    if (request.partnerId) {
      assignments = await this.assignmentRepository.findByPartnerId(
        request.partnerId,
        request.activeOnly,
      );
    } else if (request.staffUserId) {
      assignments = await this.assignmentRepository.findByStaffUserId(
        request.staffUserId,
        request.activeOnly,
      );
    } else {
      assignments = await this.assignmentRepository.findAll(request.activeOnly);
    }

    // Enriquecer con información de partners y usuarios
    const assignmentDtos = await Promise.all(
      assignments.map(async (assignment) => {
        const partner = await this.partnerRepository.findById(assignment.partnerId);
        const staffUser = await this.userRepository.findById(assignment.staffUserId);

        return new PartnerStaffAssignmentDto(
          assignment.id,
          assignment.partnerId,
          partner?.name || 'Unknown Partner',
          assignment.staffUserId,
          staffUser?.name || 'Unknown User',
          staffUser?.email || 'unknown@example.com',
          assignment.commissionPercent,
          assignment.isActive,
          assignment.startDate,
          assignment.endDate,
          assignment.notes,
          assignment.createdAt,
          assignment.updatedAt,
        );
      }),
    );

    return new GetPartnerStaffAssignmentsResponse(assignmentDtos, assignmentDtos.length);
  }
}
