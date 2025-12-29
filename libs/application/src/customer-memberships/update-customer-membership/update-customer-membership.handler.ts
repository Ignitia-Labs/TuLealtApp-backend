import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  ITenantRepository,
  IBranchRepository,
  ICustomerTierRepository,
  CustomerMembership,
} from '@libs/domain';
import { UpdateCustomerMembershipRequest } from './update-customer-membership.request';
import { UpdateCustomerMembershipResponse } from './update-customer-membership.response';
import { CustomerMembershipDto } from '../dto/customer-membership.dto';

/**
 * Handler para el caso de uso de actualizar una membership
 */
@Injectable()
export class UpdateCustomerMembershipHandler {
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

  async execute(request: UpdateCustomerMembershipRequest): Promise<UpdateCustomerMembershipResponse> {
    // Obtener la membership existente
    const membership = await this.membershipRepository.findById(request.membershipId);

    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // Actualizar campos si se proporcionan
    let updatedMembership = membership;

    if (request.points !== undefined) {
      // Si cambian los puntos, recalcular el tier
      const tier = await this.tierRepository.findByPoints(membership.tenantId, request.points);
      updatedMembership = updatedMembership.updateTier(tier ? tier.id : null);
      // Actualizar puntos usando el método de dominio
      if (request.points > membership.points) {
        updatedMembership = updatedMembership.addPoints(request.points - membership.points);
      } else if (request.points < membership.points) {
        updatedMembership = updatedMembership.subtractPoints(membership.points - request.points);
      }
    }

    if (request.tierId !== undefined) {
      updatedMembership = updatedMembership.updateTier(request.tierId);
    }

    if (request.status !== undefined) {
      updatedMembership = request.status === 'active' ? updatedMembership.activate() : updatedMembership.deactivate();
    }

    // Actualizar campos que no tienen métodos de dominio
    // Usar los métodos de dominio cuando sea posible, o crear nueva instancia
    if (request.totalSpent !== undefined || request.totalVisits !== undefined || request.lastVisit !== undefined) {
      // Para actualizar totalSpent, usar recordPurchase con la diferencia
      if (request.totalSpent !== undefined && request.totalSpent !== updatedMembership.totalSpent) {
        const difference = request.totalSpent - updatedMembership.totalSpent;
        updatedMembership = updatedMembership.recordPurchase(difference);
      }

      // Para actualizar totalVisits, usar recordVisit con la diferencia
      if (request.totalVisits !== undefined && request.totalVisits > updatedMembership.totalVisits) {
        const visitsToAdd = request.totalVisits - updatedMembership.totalVisits;
        for (let i = 0; i < visitsToAdd; i++) {
          updatedMembership = updatedMembership.recordVisit();
        }
      }

      // Para lastVisit, necesitamos crear una nueva instancia ya que no hay método específico
      if (request.lastVisit !== undefined && request.lastVisit !== updatedMembership.lastVisit) {
        updatedMembership = new CustomerMembership(
          updatedMembership.id,
          updatedMembership.userId,
          updatedMembership.tenantId,
          updatedMembership.registrationBranchId,
          updatedMembership.points,
          updatedMembership.tierId,
          updatedMembership.totalSpent,
          updatedMembership.totalVisits,
          request.lastVisit,
          updatedMembership.joinedDate,
          updatedMembership.qrCode,
          updatedMembership.status,
          updatedMembership.createdAt,
          new Date(),
        );
      }
    }

    // Guardar la membership actualizada
    const savedMembership = await this.membershipRepository.update(updatedMembership);

    // Convertir a DTO con información denormalizada
    const membershipDto = await this.toDto(savedMembership);

    return new UpdateCustomerMembershipResponse(membershipDto);
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

    // Obtener información de la branch de registro
    const branch = await this.branchRepository.findById(membership.registrationBranchId);
    if (!branch) {
      throw new Error(`Branch with ID ${membership.registrationBranchId} not found`);
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
      branch.name,
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

