import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IUserRepository,
  ITenantRepository,
  IBranchRepository,
  ICustomerTierRepository,
} from '@libs/domain';
import { GetCustomerByQrRequest } from './get-customer-by-qr.request';
import { GetCustomerByQrResponse } from './get-customer-by-qr.response';

/**
 * Handler para buscar un customer por QR code
 * Verifica que el customer pertenezca al partner del usuario autenticado
 */
@Injectable()
export class GetCustomerByQrHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @Inject('ICustomerTierRepository')
    private readonly tierRepository: ICustomerTierRepository,
  ) {}

  async execute(
    request: GetCustomerByQrRequest,
    requestingPartnerId: number,
  ): Promise<GetCustomerByQrResponse> {
    // Buscar membership por QR code
    const membership = await this.membershipRepository.findByQrCode(request.qrCode);

    if (!membership) {
      throw new NotFoundException(`Customer with QR code ${request.qrCode} not found`);
    }

    // Verificar que el customer esté activo
    if (membership.status !== 'active') {
      throw new ForbiddenException(`Customer membership is ${membership.status}`);
    }

    // Verificar que el tenant pertenece al partner del usuario autenticado
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${membership.tenantId} not found`);
    }

    if (tenant.partnerId !== requestingPartnerId) {
      throw new ForbiddenException('Customer does not belong to your partner');
    }

    // Obtener información del customer
    const user = await this.userRepository.findById(membership.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${membership.userId} not found`);
    }

    // Obtener información de la branch de registro (puede ser null si fue eliminada)
    let branchName: string | null = null;
    if (membership.registrationBranchId) {
      const branch = await this.branchRepository.findById(membership.registrationBranchId);
      if (branch) {
        branchName = branch.name;
      }
    }

    // Obtener tier basado en los puntos actuales del customer
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

    return new GetCustomerByQrResponse(
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
      membership.qrCode!,
      membership.createdAt,
      membership.updatedAt,
    );
  }
}

