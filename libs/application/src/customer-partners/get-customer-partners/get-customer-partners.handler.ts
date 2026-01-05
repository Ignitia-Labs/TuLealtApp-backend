import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerPartnerRepository,
  IUserRepository,
  IPartnerRepository,
  ITenantRepository,
  IBranchRepository,
} from '@libs/domain';
import { GetCustomerPartnersRequest } from './get-customer-partners.request';
import { GetCustomerPartnersResponse, CustomerPartnerItem } from './get-customer-partners.response';

/**
 * Handler para el caso de uso de obtener los partners de un customer
 */
@Injectable()
export class GetCustomerPartnersHandler {
  constructor(
    @Inject('ICustomerPartnerRepository')
    private readonly customerPartnerRepository: ICustomerPartnerRepository,
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

    // Obtener las asociaciones
    const associations = request.status
      ? await this.customerPartnerRepository.findByUserIdAndStatus(request.userId, request.status)
      : await this.customerPartnerRepository.findByUserId(request.userId);

    // Convertir a DTOs con información denormalizada
    const partnerItems = await Promise.all(
      associations.map((association) => this.toDto(association)),
    );

    return new GetCustomerPartnersResponse(partnerItems);
  }

  /**
   * Convierte una entidad CustomerPartner a DTO con información denormalizada
   */
  private async toDto(association: any): Promise<CustomerPartnerItem> {
    // Obtener información del partner
    const partner = await this.partnerRepository.findById(association.partnerId);
    if (!partner) {
      throw new Error(`Partner with ID ${association.partnerId} not found`);
    }

    // Obtener información del tenant
    const tenant = await this.tenantRepository.findById(association.tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${association.tenantId} not found`);
    }

    // Obtener información de la branch de registro (puede ser null si fue eliminada)
    let branchName = 'N/A';
    if (association.registrationBranchId) {
      const branch = await this.branchRepository.findById(association.registrationBranchId);
      if (branch) {
        branchName = branch.name;
      }
    }

    return new CustomerPartnerItem(
      association.id,
      association.partnerId,
      partner.name,
      association.tenantId,
      tenant.name,
      association.registrationBranchId || 0,
      branchName,
      association.status,
      association.joinedDate,
      association.lastActivityDate,
      association.metadata,
    );
  }
}
