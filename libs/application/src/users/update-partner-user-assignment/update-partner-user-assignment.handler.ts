import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import {
  IUserRepository,
  IPartnerRepository,
  ITenantRepository,
  IBranchRepository,
} from '@libs/domain';
import { UpdatePartnerUserAssignmentRequest } from './update-partner-user-assignment.request';
import { UpdatePartnerUserAssignmentResponse } from './update-partner-user-assignment.response';

/**
 * Handler para actualizar la asignación de tenant y branch a un usuario partner
 */
@Injectable()
export class UpdatePartnerUserAssignmentHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(
    request: UpdatePartnerUserAssignmentRequest,
  ): Promise<UpdatePartnerUserAssignmentResponse> {
    // Buscar el usuario
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Validar que el usuario tenga rol PARTNER o PARTNER_STAFF
    const isPartnerUser = user.hasRole('PARTNER') || user.hasRole('PARTNER_STAFF');
    if (!isPartnerUser) {
      throw new BadRequestException(
        `User with ID ${request.userId} must have role PARTNER or PARTNER_STAFF`,
      );
    }

    // Validar que el usuario tenga un partner asociado
    if (!user.partnerId) {
      throw new BadRequestException(
        `User with ID ${request.userId} does not have a partner associated`,
      );
    }

    // Validar tenantId si se proporciona
    if (request.tenantId !== undefined && request.tenantId !== null) {
      const tenant = await this.tenantRepository.findById(request.tenantId);
      if (!tenant) {
        throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
      }

      // Validar que el tenant pertenezca al mismo partner del usuario
      if (tenant.partnerId !== user.partnerId) {
        throw new BadRequestException(
          `Tenant with ID ${request.tenantId} does not belong to partner ${user.partnerId}`,
        );
      }
    }

    // Validar branchId si se proporciona
    if (request.branchId !== undefined && request.branchId !== null) {
      const branch = await this.branchRepository.findById(request.branchId);
      if (!branch) {
        throw new NotFoundException(`Branch with ID ${request.branchId} not found`);
      }

      // Si hay tenantId, validar que el branch pertenezca a ese tenant
      if (request.tenantId !== undefined && request.tenantId !== null) {
        if (branch.tenantId !== request.tenantId) {
          throw new BadRequestException(
            `Branch with ID ${request.branchId} does not belong to tenant ${request.tenantId}`,
          );
        }
      } else if (user.tenantId) {
        // Si no se proporciona tenantId pero el usuario ya tiene uno, validar contra ese
        if (branch.tenantId !== user.tenantId) {
          throw new BadRequestException(
            `Branch with ID ${request.branchId} does not belong to user's tenant ${user.tenantId}`,
          );
        }
      } else {
        // Si no hay tenantId en el request ni en el usuario, no se puede asignar branch
        throw new BadRequestException(
          'Cannot assign branch without a tenant. Please assign a tenant first.',
        );
      }
    } else if (request.branchId === null && request.tenantId === null) {
      // Si se está removiendo el tenant, también se debe remover el branch
      // Esto se maneja automáticamente al actualizar
    }

    // Actualizar el usuario con los nuevos valores
    const updatedUser = user.updateTenantAndBranch(
      request.tenantId !== undefined ? request.tenantId : user.tenantId,
      request.branchId !== undefined ? request.branchId : user.branchId,
    );

    // Si se removió el tenant, también remover el branch
    if (request.tenantId === null && updatedUser.branchId !== null) {
      const finalUser = updatedUser.updateTenantAndBranch(null, null);
      const savedUser = await this.userRepository.update(finalUser);
      return new UpdatePartnerUserAssignmentResponse(
        savedUser.id,
        savedUser.email,
        savedUser.name,
        savedUser.partnerId,
        savedUser.tenantId,
        savedUser.branchId,
        savedUser.roles,
        savedUser.updatedAt,
      );
    }

    // Guardar los cambios
    const savedUser = await this.userRepository.update(updatedUser);

    return new UpdatePartnerUserAssignmentResponse(
      savedUser.id,
      savedUser.email,
      savedUser.name,
      savedUser.partnerId,
      savedUser.tenantId,
      savedUser.branchId,
      savedUser.roles,
      savedUser.updatedAt,
    );
  }
}
