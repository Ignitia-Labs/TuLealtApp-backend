import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository, ITenantRepository, IBranchRepository } from '@libs/domain';
import { GetPartnerWithTenantsAndBranchesRequest } from './get-partner-with-tenants-and-branches.request';
import { GetPartnerWithTenantsAndBranchesResponse } from './get-partner-with-tenants-and-branches.response';
import { TenantWithBranchesDto } from './get-partner-with-tenants-and-branches.response';
import { GetTenantResponse } from '../../tenants/get-tenant/get-tenant.response';
import { GetBranchResponse } from '../../branches/get-branch/get-branch.response';
import {
  TenantFeaturesEntity,
  PartnerSubscriptionEntity,
  PartnerSubscriptionUsageEntity,
} from '@libs/infrastructure';
import { PartnerLimitsSwaggerDto } from '../dto/partner-limits-swagger.dto';
import { IPricingPlanRepository } from '@libs/domain';
import { SubscriptionUsageHelper } from '@libs/application';
import { PartnerUsageDto } from './get-partner-with-tenants-and-branches.response';

/**
 * Handler para el caso de uso de obtener un partner con sus tenants y branches
 */
@Injectable()
export class GetPartnerWithTenantsAndBranchesHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
    @InjectRepository(TenantFeaturesEntity)
    private readonly featuresRepository: Repository<TenantFeaturesEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ) {}

  async execute(
    request: GetPartnerWithTenantsAndBranchesRequest,
  ): Promise<GetPartnerWithTenantsAndBranchesResponse> {
    // Verificar que el partner existe
    const partner = await this.partnerRepository.findById(request.partnerId);

    if (!partner) {
      throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
    }

    // Obtener todos los tenants del partner
    const tenants = await this.tenantRepository.findByPartnerId(request.partnerId);

    // Obtener todas las características de los tenants en una sola consulta
    const tenantIds = tenants.map((t) => t.id);
    const featuresEntities =
      tenantIds.length > 0
        ? await this.featuresRepository.find({
            where: tenantIds.map((id) => ({ tenantId: id })),
          })
        : [];

    // Crear un mapa de features por tenantId para acceso rápido
    const featuresMap = new Map<number, TenantFeaturesEntity>();
    featuresEntities.forEach((feature) => {
      featuresMap.set(feature.tenantId, feature);
    });

    // Obtener todas las branches de todos los tenants en una sola consulta
    const branchesByTenant = new Map<number, GetBranchResponse[]>();
    if (tenantIds.length > 0) {
      // Obtener todas las branches de los tenants
      const allBranches = await Promise.all(
        tenantIds.map((tenantId) => this.branchRepository.findByTenantId(tenantId)),
      );

      // Organizar branches por tenantId
      allBranches.forEach((branches) => {
        if (branches.length > 0) {
          const tenantId = branches[0].tenantId;
          branchesByTenant.set(
            tenantId,
            branches.map(
              (branch) =>
                new GetBranchResponse(
                  branch.id,
                  branch.tenantId,
                  branch.name,
                  branch.address,
                  branch.city,
                  branch.country,
                  branch.phone,
                  branch.email,
                  branch.quickSearchCode,
                  branch.status,
                  branch.createdAt,
                  branch.updatedAt,
                ),
            ),
          );
        }
      });
    }

    // Convertir a DTOs de respuesta con features y branches
    const tenantsWithBranches: TenantWithBranchesDto[] = tenants.map((tenant) => {
      const featuresEntity = featuresMap.get(tenant.id);

      // Valores por defecto si no existen características
      const qrScanning = featuresEntity?.qrScanning ?? true;
      const offlineMode = featuresEntity?.offlineMode ?? true;
      const referralProgram = featuresEntity?.referralProgram ?? true;
      const birthdayRewards = featuresEntity?.birthdayRewards ?? true;

      const tenantResponse = new GetTenantResponse(
        tenant.id,
        tenant.partnerId,
        tenant.name,
        tenant.description,
        tenant.logo,
        tenant.banner,
        tenant.category,
        tenant.currencyId,
        tenant.primaryColor,
        tenant.secondaryColor,
        tenant.pointsExpireDays,
        tenant.minPointsToRedeem,
        tenant.taxPercentage,
        tenant.quickSearchCode,
        tenant.status,
        tenant.createdAt,
        tenant.updatedAt,
        qrScanning,
        offlineMode,
        referralProgram,
        birthdayRewards,
      );

      const branches = branchesByTenant.get(tenant.id) || [];

      return new TenantWithBranchesDto(tenantResponse, branches);
    });

    // Obtener límites desde pricing_plan_limits
    let limitsDto: PartnerLimitsSwaggerDto | null = null;
    try {
      const planLimits = await SubscriptionUsageHelper.getPlanLimitsForPartner(
        request.partnerId,
        this.subscriptionRepository,
        this.pricingPlanRepository,
      );

      if (planLimits) {
        limitsDto = {
          maxTenants: planLimits.maxTenants ?? -1,
          maxBranches: planLimits.maxBranches ?? -1,
          maxCustomers: planLimits.maxCustomers ?? -1,
          maxRewards: planLimits.maxRewards ?? -1,
          maxAdmins: planLimits.maxAdmins ?? -1,
          storageGB: planLimits.storageGB ?? -1,
          apiCallsPerMonth: planLimits.apiCallsPerMonth ?? -1,
          maxLoyaltyPrograms: planLimits.maxLoyaltyPrograms ?? -1,
          maxLoyaltyProgramsBase: planLimits.maxLoyaltyProgramsBase ?? -1,
          maxLoyaltyProgramsPromo: planLimits.maxLoyaltyProgramsPromo ?? -1,
          maxLoyaltyProgramsPartner: planLimits.maxLoyaltyProgramsPartner ?? -1,
          maxLoyaltyProgramsSubscription: planLimits.maxLoyaltyProgramsSubscription ?? -1,
          maxLoyaltyProgramsExperimental: planLimits.maxLoyaltyProgramsExperimental ?? -1,
        };
      }
    } catch (error) {
      // Si hay error al obtener límites, continuar sin ellos (no crítico)
      console.error('Error al obtener límites desde pricing plan:', error);
      limitsDto = null;
    }

    // Obtener usage actual de la suscripción
    let usageDto: PartnerUsageDto | null = null;
    try {
      const usage = await SubscriptionUsageHelper.getCurrentUsageForPartner(
        request.partnerId,
        this.subscriptionRepository,
        this.usageRepository,
      );

      usageDto = new PartnerUsageDto(
        usage.tenantsCount,
        usage.branchesCount,
        usage.customersCount,
        usage.rewardsCount,
        usage.loyaltyProgramsCount,
        usage.loyaltyProgramsBaseCount,
        usage.loyaltyProgramsPromoCount,
        usage.loyaltyProgramsPartnerCount,
        usage.loyaltyProgramsSubscriptionCount,
        usage.loyaltyProgramsExperimentalCount,
      );
    } catch (error) {
      // Si hay error al obtener usage, continuar sin él (no crítico)
      console.error('Error al obtener usage desde subscription:', error);
      usageDto = null;
    }

    return new GetPartnerWithTenantsAndBranchesResponse(
      partner.id,
      partner.name,
      partner.responsibleName,
      partner.email,
      partner.phone,
      partner.countryId,
      partner.city,
      partner.plan,
      partner.logo,
      partner.banner,
      partner.category,
      partner.branchesNumber,
      partner.website,
      partner.socialMedia,
      partner.currencyId,
      partner.businessName,
      partner.taxId,
      partner.fiscalAddress,
      partner.paymentMethod,
      partner.billingEmail,
      partner.domain,
      partner.status,
      partner.createdAt,
      partner.updatedAt,
      tenantsWithBranches,
      limitsDto,
      usageDto,
    );
  }
}
