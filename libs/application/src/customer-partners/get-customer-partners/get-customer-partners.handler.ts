import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IUserRepository,
  IPartnerRepository,
  ITenantRepository,
  IBranchRepository,
} from '@libs/domain';
import { GetCustomerPartnersRequest } from './get-customer-partners.request';
import { GetCustomerPartnersResponse, CustomerPartnerItem } from './get-customer-partners.response';

/**
 * Handler para el caso de uso de obtener los partners de un customer
 * Ahora usa customer_memberships como fuente de verdad, obteniendo partnerId desde tenant
 */
@Injectable()
export class GetCustomerPartnersHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(request: GetCustomerPartnersRequest): Promise<GetCustomerPartnersResponse> {
    // Validar que el usuario existe
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Obtener las memberships (que ahora reemplazan a customer_partners)
    const memberships = request.status
      ? await this.membershipRepository.findByUserIdAndStatus(
          request.userId,
          request.status as 'active' | 'inactive',
        )
      : await this.membershipRepository.findByUserId(request.userId);

    // Convertir a DTOs con información denormalizada
    const partnerItems = await Promise.all(
      memberships.map((membership) => this.toDto(membership)),
    );

    return new GetCustomerPartnersResponse(partnerItems);
  }

  /**
   * Convierte una entidad CustomerMembership a DTO con información denormalizada
   * Obtiene partnerId desde tenant.partnerId
   */
  private async toDto(membership: any): Promise<CustomerPartnerItem> {
    // Obtener información del tenant para obtener partnerId
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${membership.tenantId} not found`);
    }

    // Obtener información del partner
    const partner = await this.partnerRepository.findById(tenant.partnerId);
    if (!partner) {
      throw new Error(`Partner with ID ${tenant.partnerId} not found`);
    }

    // Obtener información de la branch de registro (puede ser null si fue eliminada)
    let branchName = 'N/A';
    if (membership.registrationBranchId) {
      const branch = await this.branchRepository.findById(membership.registrationBranchId);
      if (branch) {
        branchName = branch.name;
      }
    }

    return new CustomerPartnerItem(
      membership.id,
      tenant.partnerId,
      partner.name,
      membership.tenantId,
      tenant.name,
      membership.registrationBranchId || 0,
      branchName,
      membership.status,
      membership.joinedDate,
      membership.lastVisit, // Usar lastVisit como lastActivityDate
      null, // metadata no existe en memberships
    );
  }
}
