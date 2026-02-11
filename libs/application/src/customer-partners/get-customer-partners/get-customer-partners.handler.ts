import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IUserRepository,
  IPartnerRepository,
  ITenantRepository,
  IBranchRepository,
  ICustomerTierRepository,
  ITierPolicyRepository,
  ITierBenefitRepository,
  CustomerTier,
  TierPolicy,
  TierBenefit,
} from '@libs/domain';
import { GetCustomerPartnersRequest } from './get-customer-partners.request';
import {
  GetCustomerPartnersResponse,
  CustomerPartnerItem,
} from './get-customer-partners.response';
import {
  TierInfoDto,
  TierPolicyDto,
  TierBenefitDetailsDto,
} from '../../customer-memberships/dto/customer-membership.dto';

/**
 * Handler para el caso de uso de obtener los partners de un customer
 * Ahora usa customer_memberships como fuente de verdad, obteniendo partnerId desde tenant
 * Incluye información completa de tiers y políticas de tier para cada tenant
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
    @Inject('ICustomerTierRepository')
    private readonly customerTierRepository: ICustomerTierRepository,
    @Inject('ITierPolicyRepository')
    private readonly tierPolicyRepository: ITierPolicyRepository,
    @Inject('ITierBenefitRepository')
    private readonly tierBenefitRepository: ITierBenefitRepository,
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

    // Obtener todos los tenantIds únicos para batch fetching (optimización de performance)
    const uniqueTenantIds = [...new Set(memberships.map((m) => m.tenantId))];

    // Batch fetch: obtener tier data para todos los tenants de una vez
    const tierDataMap = await this.batchFetchTierData(uniqueTenantIds);

    // Convertir a DTOs con información denormalizada incluyendo tiers
    const partnerItems = await Promise.all(
      memberships.map((membership) => this.toDto(membership, tierDataMap)),
    );

    return new GetCustomerPartnersResponse(partnerItems);
  }

  /**
   * Batch fetch de tier data para múltiples tenants
   * Optimización para evitar N+1 queries
   */
  private async batchFetchTierData(
    tenantIds: number[],
  ): Promise<Map<number, { tiers: TierInfoDto[]; policy: TierPolicyDto | null }>> {
    const tierDataMap = new Map<number, { tiers: TierInfoDto[]; policy: TierPolicyDto | null }>();

    // Fetch tier data para cada tenant
    await Promise.all(
      tenantIds.map(async (tenantId) => {
        try {
          const [tiers, policy] = await Promise.all([
            this.fetchTiersForTenant(tenantId),
            this.fetchTierPolicyForTenant(tenantId),
          ]);

          tierDataMap.set(tenantId, { tiers, policy });
        } catch (error) {
          // Si hay error al obtener tier data, usar valores por defecto
          console.error(`Error fetching tier data for tenant ${tenantId}:`, error);
          tierDataMap.set(tenantId, { tiers: [], policy: null });
        }
      }),
    );

    return tierDataMap;
  }

  /**
   * Obtiene y mapea todos los tiers activos de un tenant
   */
  private async fetchTiersForTenant(tenantId: number): Promise<TierInfoDto[]> {
    // Obtener tiers activos del tenant
    const tiers = await this.customerTierRepository.findActiveByTenantId(tenantId);

    if (!tiers || tiers.length === 0) {
      return [];
    }

    // Obtener tier benefits para todos los tiers
    const tiersWithBenefits = await Promise.all(
      tiers.map(async (tier) => {
        const tierBenefit = await this.fetchTierBenefitForTier(tier.id);
        return this.mapTierToDto(tier, tierBenefit);
      }),
    );

    // Ordenar por prioridad (del más bajo al más alto)
    return tiersWithBenefits.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Obtiene tier benefit para un tier específico
   */
  private async fetchTierBenefitForTier(tierId: number): Promise<TierBenefit | null> {
    try {
      const benefits = await this.tierBenefitRepository.findActiveByTierId(tierId);
      return benefits && benefits.length > 0 ? benefits[0] : null;
    } catch (error) {
      console.error(`Error fetching tier benefit for tier ${tierId}:`, error);
      return null;
    }
  }

  /**
   * Mapea un CustomerTier a TierInfoDto
   */
  private mapTierToDto(tier: CustomerTier, tierBenefit: TierBenefit | null): TierInfoDto {
    let tierBenefitDetails: TierBenefitDetailsDto | null = null;

    if (tierBenefit) {
      tierBenefitDetails = new TierBenefitDetailsDto(
        tierBenefit.pointsMultiplier,
        tierBenefit.exclusiveRewards || [],
        tierBenefit.higherCaps,
        tierBenefit.cooldownReduction,
        tierBenefit.categoryBenefits,
      );
    }

    return new TierInfoDto(
      tier.id,
      tier.name,
      tier.description,
      tier.minPoints,
      tier.maxPoints,
      tier.color,
      tier.icon,
      tier.benefits || [],
      tier.multiplier,
      tier.priority,
      tierBenefitDetails,
    );
  }

  /**
   * Obtiene y mapea la política de tiers de un tenant
   */
  private async fetchTierPolicyForTenant(tenantId: number): Promise<TierPolicyDto | null> {
    try {
      const policy = await this.tierPolicyRepository.findActiveByTenantId(tenantId);

      if (!policy) {
        return null;
      }

      return this.mapTierPolicyToDto(policy);
    } catch (error) {
      console.error(`Error fetching tier policy for tenant ${tenantId}:`, error);
      return null;
    }
  }

  /**
   * Mapea un TierPolicy a TierPolicyDto
   */
  private mapTierPolicyToDto(policy: TierPolicy): TierPolicyDto {
    // Convertir thresholds object a formato de response
    const thresholdsRecord: Record<string, number> = {};
    for (const [tierId, minPoints] of Object.entries(policy.thresholds)) {
      thresholdsRecord[tierId] = minPoints;
    }

    return new TierPolicyDto(
      policy.evaluationWindow,
      policy.evaluationType,
      policy.gracePeriodDays,
      policy.minTierDuration,
      policy.downgradeStrategy,
      policy.status,
      policy.description,
      thresholdsRecord,
    );
  }

  /**
   * Convierte una entidad CustomerMembership a DTO con información denormalizada
   * Obtiene partnerId desde tenant.partnerId
   * Incluye tier information desde el map pre-cargado
   */
  private async toDto(
    membership: any,
    tierDataMap: Map<number, { tiers: TierInfoDto[]; policy: TierPolicyDto | null }>,
  ): Promise<CustomerPartnerItem> {
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

    // Obtener tier data desde el map (ya pre-cargado)
    const tierData = tierDataMap.get(membership.tenantId) || { tiers: [], policy: null };

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
      tierData.tiers,
      tierData.policy,
    );
  }
}
