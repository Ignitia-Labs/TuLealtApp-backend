import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPartnerRequestRepository, PartnerRequest, IUserRepository, User } from '@libs/domain';
import { AssignPartnerRequestUserRequest } from './assign-partner-request-user.request';
import { AssignPartnerRequestUserResponse } from './assign-partner-request-user.response';

/**
 * Handler para el caso de uso de asignar un usuario a una solicitud de partner
 */
@Injectable()
export class AssignPartnerRequestUserHandler {
  constructor(
    @Inject('IPartnerRequestRepository')
    private readonly partnerRequestRepository: IPartnerRequestRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    request: AssignPartnerRequestUserRequest,
  ): Promise<AssignPartnerRequestUserResponse> {
    // Verificar que la solicitud existe
    const partnerRequest = await this.partnerRequestRepository.findById(request.requestId);

    if (!partnerRequest) {
      throw new NotFoundException(`Partner request with ID ${request.requestId} not found`);
    }

    // Verificar que el usuario existe
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Verificar que el usuario tiene rol ADMIN o STAFF
    const hasAdminOrStaffRole = user.hasRole('ADMIN') || user.hasRole('STAFF');

    if (!hasAdminOrStaffRole) {
      throw new BadRequestException(`User with ID ${request.userId} must have ADMIN or STAFF role`);
    }

    // Verificar que el usuario está activo
    if (!user.isActive) {
      throw new BadRequestException(`User with ID ${request.userId} is not active`);
    }

    // Asignar el usuario a la solicitud
    const updatedRequest = partnerRequest.assignUser(request.userId);

    // Guardar la solicitud actualizada
    const savedRequest = await this.partnerRequestRepository.update(updatedRequest);

    return new AssignPartnerRequestUserResponse(
      savedRequest.id,
      savedRequest.assignedTo,
      savedRequest.lastUpdated,
    );
  }
}
