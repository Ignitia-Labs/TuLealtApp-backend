import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerPartnerRepository,
  IPartnerRepository,
  IUserRepository,
  ITenantRepository,
  IBranchRepository,
} from '@libs/domain';
import { GetPartnerCustomersRequest } from './get-partner-customers.request';
import {
  GetPartnerCustomersResponse,
  PartnerCustomerItem,
  PaginationInfo,
} from './get-partner-customers.response';

/**
 * Handler para el caso de uso de obtener los customers de un partner (con paginación)
 */
@Injectable()
export class GetPartnerCustomersHandler {
  constructor(
    @Inject('ICustomerPartnerRepository')
    private readonly customerPartnerRepository: ICustomerPartnerRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(request: GetPartnerCustomersRequest): Promise<GetPartnerCustomersResponse> {
    // Validar que el partner existe
    const partner = await this.partnerRepository.findById(request.partnerId);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
    }

    // Obtener parámetros de paginación
    const page = request.page || 1;
    const limit = request.limit || 50;

    // Obtener las asociaciones con paginación
    const { data: associations, total } =
      await this.customerPartnerRepository.findCustomersByPartnerIdPaginated(
        request.partnerId,
        page,
        limit,
        request.status,
      );

    // Convertir a DTOs con información denormalizada
    const customerItems = await Promise.all(
      associations.map((association) => this.toDto(association)),
    );

    // Crear información de paginación
    const pagination = new PaginationInfo(page, limit, total);

    return new GetPartnerCustomersResponse(customerItems, pagination);
  }

  /**
   * Convierte una entidad CustomerPartner a DTO con información denormalizada
   */
  private async toDto(association: any): Promise<PartnerCustomerItem> {
    // Obtener información del customer
    const user = await this.userRepository.findById(association.userId);
    if (!user) {
      throw new Error(`User with ID ${association.userId} not found`);
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

    return new PartnerCustomerItem(
      association.id,
      association.userId,
      user.name,
      user.email,
      association.tenantId,
      tenant.name,
      association.registrationBranchId || 0,
      branchName,
      association.status,
      association.joinedDate,
      association.lastActivityDate,
    );
  }
}
