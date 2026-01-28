import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository, ITenantRepository, IBranchRepository } from '@libs/domain';
import { GetPartnerWithTenantsAndBranchesRequest } from './get-partner-with-tenants-and-branches.request';
import { GetPartnerWithTenantsAndBranchesResponse } from './get-partner-with-tenants-and-branches.response';
import { TenantWithBranchesDto } from './get-partner-with-tenants-and-branches.response';
import { GetTenantResponse } from '../../tenants/get-tenant/get-tenant.response';
import { GetBranchResponse } from '../../branches/get-branch/get-branch.response';
import { TenantFeaturesEntity, PartnerLimitsEntity } from '@libs/infrastructure';
import { PartnerLimitsSwaggerDto } from '../dto/partner-limits-swagger.dto';

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
    @InjectRepository(TenantFeaturesEntity)
    private readonly featuresRepository: Repository<TenantFeaturesEntity>,
    @InjectRepository(PartnerLimitsEntity)
    private readonly limitsRepository: Repository<PartnerLimitsEntity>,
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

    // Obtener los límites del partner
    let limitsDto: PartnerLimitsSwaggerDto | null = null;
    try {
      const limitsEntity = await this.limitsRepository.findOne({
        where: { partnerId: partner.id },
      });

      if (limitsEntity) {
        limitsDto = {
          maxTenants: Number(limitsEntity.maxTenants) || 0,
          maxBranches: Number(limitsEntity.maxBranches) || 0,
          maxCustomers: Number(limitsEntity.maxCustomers) || 0,
          maxRewards: Number(limitsEntity.maxRewards) || 0,
          maxAdmins: Number(limitsEntity.maxAdmins ?? -1),
          storageGB: Number(limitsEntity.storageGB ?? -1),
          apiCallsPerMonth: Number(limitsEntity.apiCallsPerMonth ?? -1),
        };
      }
    } catch (error) {
      // Si hay error al obtener límites, continuar sin ellos (no crítico)
      console.error('Error al obtener límites del partner:', error);
      limitsDto = null;
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
      partner.rewardType,
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
    );
  }
}
