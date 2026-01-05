import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IPartnerRepository,
  IUserRepository,
  ITenantRepository,
  IBranchRepository,
  ICustomerTierRepository,
  CustomerMembership,
} from '@libs/domain';
import { GetPartnerCustomersRequest } from './get-partner-customers.request';
import {
  GetPartnerCustomersResponse,
  PartnerCustomerItem,
  PaginationInfo,
} from './get-partner-customers.response';

/**
 * Handler para el caso de uso de obtener los customers de un partner (con paginación)
 * Ahora usa customer_memberships como fuente de verdad, filtrando por tenant.partnerId
 */
@Injectable()
export class GetPartnerCustomersHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @Inject('ICustomerTierRepository')
    private readonly tierRepository: ICustomerTierRepository,
  ) {}

  async execute(request: GetPartnerCustomersRequest): Promise<GetPartnerCustomersResponse> {
    // Validar que el partner existe
    const partner = await this.partnerRepository.findById(request.partnerId);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
    }

    // Convertir status a tipo válido (suspended no existe en memberships, se ignora)
    const statusFilter: 'active' | 'inactive' | undefined =
      request.status && request.status !== 'suspended'
        ? (request.status as 'active' | 'inactive')
        : undefined;

    // Si no se proporcionan parámetros de paginación, obtener todos los customers
    const hasPagination = request.page !== undefined || request.limit !== undefined;

    let memberships: CustomerMembership[];
    let total: number;
    let page: number;
    let limit: number;

    if (hasPagination) {
      // Usar paginación
      page = request.page || 1;
      limit = request.limit || 50;

      const result = await this.membershipRepository.findCustomersByPartnerIdPaginated(
        request.partnerId,
        page,
        limit,
        statusFilter,
      );
      memberships = result.data;
      total = result.total;
    } else {
      // Obtener todos sin paginación
      memberships = await this.membershipRepository.findCustomersByPartnerId(
        request.partnerId,
        statusFilter,
      );
      total = memberships.length;
      page = 1;
      limit = total;
    }

    // Convertir a DTOs con información denormalizada
    const customerItems = await Promise.all(
      memberships.map((membership) => this.toDto(membership)),
    );

    // Crear información de paginación
    const pagination = new PaginationInfo(page, limit, total);

    return new GetPartnerCustomersResponse(customerItems, pagination);
  }

  /**
   * Convierte una entidad CustomerMembership a DTO con información denormalizada
   * Incluye información de puntos y tier/ranking basado en points rules
   */
  private async toDto(membership: CustomerMembership): Promise<PartnerCustomerItem> {
    // Obtener información del customer
    const user = await this.userRepository.findById(membership.userId);
    if (!user) {
      throw new Error(`User with ID ${membership.userId} not found`);
    }

    // Obtener información del tenant
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${membership.tenantId} not found`);
    }

    // Obtener información de la branch de registro (puede ser null si fue eliminada)
    let branchName = 'N/A';
    if (membership.registrationBranchId) {
      const branch = await this.branchRepository.findById(membership.registrationBranchId);
      if (branch) {
        branchName = branch.name;
      }
    }

    // Obtener tier basado en los puntos actuales del customer
    // Si tiene tierId asignado, usarlo; si no, calcularlo basado en puntos
    let tierId: number | null = membership.tierId;
    let tierName: string | null = null;
    let tierColor: string | null = null;
    let tierPriority: number | null = null;

    // Buscar el tier correspondiente a los puntos actuales
    const tier = await this.tierRepository.findByPoints(membership.tenantId, membership.points);
    if (tier) {
      tierId = tier.id;
      tierName = tier.name;
      tierColor = tier.color;
      tierPriority = tier.priority;
    } else if (membership.tierId) {
      // Si no se encuentra tier por puntos pero hay tierId asignado, obtenerlo
      const assignedTier = await this.tierRepository.findById(membership.tierId);
      if (assignedTier) {
        tierName = assignedTier.name;
        tierColor = assignedTier.color;
        tierPriority = assignedTier.priority;
      }
    }

    return new PartnerCustomerItem(
      membership.id,
      membership.userId,
      user.name,
      user.email,
      user.phone,
      membership.tenantId,
      tenant.name,
      membership.registrationBranchId,
      branchName,
      membership.status,
      membership.joinedDate,
      membership.lastVisit, // Usar lastVisit como lastActivityDate
      membership.points,
      tierId,
      tierName,
      tierColor,
      tierPriority,
      membership.totalSpent,
      membership.totalVisits,
      membership.qrCode,
      membership.createdAt,
      membership.updatedAt,
    );
  }
}
