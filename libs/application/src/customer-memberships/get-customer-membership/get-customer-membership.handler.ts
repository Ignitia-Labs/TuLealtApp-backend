import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  ITenantRepository,
  IBranchRepository,
  ICustomerTierRepository,
} from '@libs/domain';
import { GetCustomerMembershipRequest } from './get-customer-membership.request';
import { GetCustomerMembershipResponse } from './get-customer-membership.response';
import { CustomerMembershipDto } from '../dto/customer-membership.dto';

/**
 * Handler para el caso de uso de obtener una membership específica
 */
@Injectable()
export class GetCustomerMembershipHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @Inject('ICustomerTierRepository')
    private readonly tierRepository: ICustomerTierRepository,
  ) {}

  async execute(
    request: GetCustomerMembershipRequest,
    requestingUserId?: number,
    requestingUserRoles?: string[],
  ): Promise<GetCustomerMembershipResponse> {
    const membership = await this.membershipRepository.findById(request.membershipId);

    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // Si el usuario es CUSTOMER, validar que solo acceda a sus propias memberships
    if (requestingUserRoles?.includes('CUSTOMER')) {
      if (membership.userId !== requestingUserId) {
        throw new ForbiddenException('You can only access your own memberships');
      }
    }

    // Convertir a DTO con información denormalizada
    const membershipDto = await this.toDto(membership);

    return new GetCustomerMembershipResponse(membershipDto);
  }

  /**
   * Convierte una entidad CustomerMembership a DTO con información denormalizada
   */
  private async toDto(membership: any): Promise<CustomerMembershipDto> {
    // Obtener información del tenant
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${membership.tenantId} not found`);
    }

    // Obtener información de la branch de registro (si existe)
    let branchName: string | null = null;
    if (membership.registrationBranchId) {
      const branch = await this.branchRepository.findById(membership.registrationBranchId);
      if (!branch) {
        throw new Error(`Branch with ID ${membership.registrationBranchId} not found`);
      }
      branchName = branch.name;
    }

    // Obtener información del tier si existe
    let tierName: string | null = null;
    let tierColor: string | null = null;
    if (membership.tierId) {
      const tier = await this.tierRepository.findById(membership.tierId);
      if (tier) {
        tierName = tier.name;
        tierColor = tier.color;
      }
    }

    // Calcular availableRewards (por ahora retornamos 0, se puede implementar lógica más adelante)
    const availableRewards = 0;

    return new CustomerMembershipDto(
      membership.id,
      membership.userId,
      membership.tenantId,
      tenant.name,
      tenant.logo,
      tenant.logo, // tenantImage puede ser igual a logo
      tenant.category,
      tenant.primaryColor,
      membership.registrationBranchId,
      branchName,
      membership.points,
      membership.tierId,
      tierName,
      tierColor,
      membership.totalSpent,
      membership.totalVisits,
      membership.lastVisit,
      membership.joinedDate,
      availableRewards,
      membership.qrCode,
      membership.status,
      membership.createdAt,
      membership.updatedAt,
    );
  }
}
