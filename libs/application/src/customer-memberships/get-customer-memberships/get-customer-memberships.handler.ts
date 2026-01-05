import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  ITenantRepository,
  IBranchRepository,
  ICustomerTierRepository,
} from '@libs/domain';
import { GetCustomerMembershipsRequest } from './get-customer-memberships.request';
import { GetCustomerMembershipsResponse } from './get-customer-memberships.response';
import { CustomerMembershipDto } from '../dto/customer-membership.dto';

/**
 * Handler para el caso de uso de obtener memberships de un usuario
 */
@Injectable()
export class GetCustomerMembershipsHandler {
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
    request: GetCustomerMembershipsRequest,
    requestingUserId?: number,
    requestingUserRoles?: string[],
  ): Promise<GetCustomerMembershipsResponse> {
    // Determinar el userId a usar
    const userId = request.userId || requestingUserId;

    if (!userId) {
      throw new Error('userId is required');
    }

    // Si el usuario es CUSTOMER, solo puede ver sus propias memberships
    if (requestingUserRoles?.includes('CUSTOMER')) {
      if (request.userId && request.userId !== requestingUserId) {
        throw new ForbiddenException('You can only access your own memberships');
      }
    }

    // Obtener memberships según los filtros
    let memberships;
    if (request.activeOnly) {
      memberships = await this.membershipRepository.findActiveByUserId(userId);
    } else {
      memberships = await this.membershipRepository.findByUserId(userId);
    }

    // Filtrar por tenantId si se proporciona
    if (request.tenantId) {
      memberships = memberships.filter((m) => m.tenantId === request.tenantId);
    }

    // Convertir a DTOs con información denormalizada
    const membershipDtos = await Promise.all(
      memberships.map((membership) => this.toDto(membership)),
    );

    return new GetCustomerMembershipsResponse(membershipDtos, membershipDtos.length);
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
