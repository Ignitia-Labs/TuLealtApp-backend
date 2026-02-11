import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  ITenantRepository,
  IBranchRepository,
  ICustomerTierRepository,
  ITierPolicyRepository,
  ITierBenefitRepository,
  CustomerTier,
  TierPolicy,
  TierBenefit,
} from '@libs/domain';
import { GetCustomerMembershipsRequest } from './get-customer-memberships.request';
import { GetCustomerMembershipsResponse } from './get-customer-memberships.response';
import {
  CustomerMembershipDto,
  TierDetailDto,
  TierInfoDto,
  TierPolicyDto,
  TierBenefitDetailsDto,
  TierSystemDto,
  MembershipCoreDto,
  TenantSummaryDto,
  BranchSummaryDto,
} from '../dto/customer-membership.dto';

/**
 * Handler para el caso de uso de obtener memberships de un usuario
 * Incluye información completa de tiers con estructura segmentada
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
    @Inject('ITierPolicyRepository')
    private readonly tierPolicyRepository: ITierPolicyRepository,
    @Inject('ITierBenefitRepository')
    private readonly tierBenefitRepository: ITierBenefitRepository,
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

    // Obtener todos los tenantIds únicos para batch fetching
    const uniqueTenantIds: number[] = Array.from(new Set(memberships.map((m) => m.tenantId as number)));

    // Batch fetch: obtener tier data para todos los tenants de una vez
    const tierDataMap = await this.batchFetchTierData(uniqueTenantIds);

    // Convertir a DTOs con información denormalizada
    const membershipDtos = await Promise.all(
      memberships.map((membership) => this.toDto(membership, tierDataMap)),
    );

    return new GetCustomerMembershipsResponse(membershipDtos, membershipDtos.length);
  }

  /**
   * Batch fetch de tier data para múltiples tenants
   * Optimización para evitar N+1 queries
   */
  private async batchFetchTierData(
    tenantIds: number[],
  ): Promise<
    Map<
      number,
      {
        tiers: TierInfoDto[];
        policy: TierPolicyDto | null;
      }
    >
  > {
    const tierDataMap = new Map<
      number,
      {
        tiers: TierInfoDto[];
        policy: TierPolicyDto | null;
      }
    >();

    // Fetch tier data para cada tenant
    await Promise.all(
      tenantIds.map(async (tenantId) => {
        try {
          const [tiers, policy] = await Promise.all([
            this.fetchTiersForTenant(tenantId),
            this.fetchTierPolicyForTenant(tenantId),
          ]);

          tierDataMap.set(tenantId, {
            tiers,
            policy,
          });
        } catch (error) {
          console.error(`Error fetching tier data for tenant ${tenantId}:`, error);
          tierDataMap.set(tenantId, {
            tiers: [],
            policy: null,
          });
        }
      }),
    );

    return tierDataMap;
  }

  /**
   * Obtiene y mapea todos los tiers activos de un tenant
   */
  private async fetchTiersForTenant(tenantId: number): Promise<TierInfoDto[]> {
    const tiers = await this.tierRepository.findActiveByTenantId(tenantId);

    if (!tiers || tiers.length === 0) {
      return [];
    }

    // Obtener tier benefits para todos los tiers
    const tiersWithBenefits = await Promise.all(
      tiers.map(async (tier) => {
        const tierBenefit = await this.fetchTierBenefitForTier(tier.id);
        return this.mapTierToInfoDto(tier, tierBenefit);
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
  private mapTierToInfoDto(tier: CustomerTier, tierBenefit: TierBenefit | null): TierInfoDto {
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
   * Mapea un CustomerTier a TierDetailDto (versión más simple para currentTier)
   */
  private mapTierToDetailDto(tier: CustomerTier): TierDetailDto {
    return new TierDetailDto(
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
   */
  private async toDto(
    membership: any,
    tierDataMap: Map<
      number,
      {
        tiers: TierInfoDto[];
        policy: TierPolicyDto | null;
      }
    >,
  ): Promise<CustomerMembershipDto> {
    // Obtener información del tenant
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${membership.tenantId} not found`);
    }

    // Crear MembershipCoreDto
    const membershipCore = new MembershipCoreDto(
      membership.id,
      membership.userId,
      membership.points,
      membership.totalSpent,
      membership.totalVisits,
      0, // availableRewards - se puede calcular después
      membership.lastVisit,
      membership.joinedDate,
      membership.qrCode,
      membership.status,
      membership.createdAt,
      membership.updatedAt,
    );

    // Crear TenantSummaryDto
    const tenantSummary = new TenantSummaryDto(
      tenant.id,
      tenant.name,
      tenant.logo,
      tenant.logo, // image = logo
      tenant.category,
      tenant.primaryColor,
    );

    // Crear BranchSummaryDto (si existe)
    let branchSummary: BranchSummaryDto | null = null;
    if (membership.registrationBranchId) {
      const branch = await this.branchRepository.findById(membership.registrationBranchId);
      if (branch) {
        branchSummary = new BranchSummaryDto(branch.id, branch.name);
      }
    }

    // Crear TierDetailDto (si tiene tier actual)
    let currentTierDetail: TierDetailDto | null = null;
    if (membership.tierId) {
      const tier = await this.tierRepository.findById(membership.tierId);
      if (tier) {
        currentTierDetail = this.mapTierToDetailDto(tier);
      }
    }

    // Obtener tier data desde el map (ya pre-cargado)
    const tierData = tierDataMap.get(membership.tenantId) || {
      tiers: [],
      policy: null,
    };

    // Crear TierSystemDto
    const tierSystem = new TierSystemDto(tierData.tiers, tierData.policy);

    return new CustomerMembershipDto(
      membershipCore,
      tenantSummary,
      branchSummary,
      currentTierDetail,
      tierSystem,
    );
  }

  /**
   * Helper para crear CustomerMembershipDto con valores por defecto para tier data
   * Usado por otros handlers que no populan tier information
   */
  static createDtoWithoutTierData(
    membership: any,
    tenant: any,
    branchName: string | null,
    tierName: string | null,
    tierColor: string | null,
    availableRewards: number,
  ): CustomerMembershipDto {
    // Crear MembershipCoreDto
    const membershipCore = new MembershipCoreDto(
      membership.id,
      membership.userId,
      membership.points,
      membership.totalSpent,
      membership.totalVisits,
      availableRewards,
      membership.lastVisit,
      membership.joinedDate,
      membership.qrCode,
      membership.status,
      membership.createdAt,
      membership.updatedAt,
    );

    // Crear TenantSummaryDto
    const tenantSummary = new TenantSummaryDto(
      tenant.id,
      tenant.name,
      tenant.logo,
      tenant.logo,
      tenant.category,
      tenant.primaryColor,
    );

    // Crear BranchSummaryDto (si existe)
    const branchSummary =
      membership.registrationBranchId && branchName
        ? new BranchSummaryDto(membership.registrationBranchId, branchName)
        : null;

    // Crear TierDetailDto simple (si tiene tier)
    const currentTierDetail =
      membership.tierId && tierName
        ? new TierDetailDto(
            membership.tierId,
            tierName,
            null, // description
            0, // minPoints
            null, // maxPoints
            tierColor || '#000000',
            null, // icon
            [], // benefits
            null, // multiplier
            0, // priority
          )
        : null;

    // TierSystem vacío
    const tierSystem = new TierSystemDto([], null);

    return new CustomerMembershipDto(
      membershipCore,
      tenantSummary,
      branchSummary,
      currentTierDetail,
      tierSystem,
    );
  }
}
