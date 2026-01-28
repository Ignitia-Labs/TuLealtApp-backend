import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPartnerRepository, ITenantRepository, Tenant, TenantFeatures } from '@libs/domain';
import { CreateTenantRequest } from './create-tenant.request';
import { CreateTenantResponse } from './create-tenant.response';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantFeaturesEntity, TenantMapper } from '@libs/infrastructure';
import { SubscriptionUsageHelper } from '@libs/application';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  TenantEntity,
  BranchEntity,
  CustomerMembershipEntity,
} from '@libs/infrastructure';
import { generateTenantQuickSearchCode } from '@libs/shared';

/**
 * Handler para el caso de uso de crear un tenant
 */
@Injectable()
export class CreateTenantHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @InjectRepository(TenantFeaturesEntity)
    private readonly featuresRepository: Repository<TenantFeaturesEntity>,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantEntityRepository: Repository<TenantEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchEntityRepository: Repository<BranchEntity>,
    @InjectRepository(CustomerMembershipEntity)
    private readonly customerMembershipRepository: Repository<CustomerMembershipEntity>,
  ) {}

  async execute(request: CreateTenantRequest): Promise<CreateTenantResponse> {
    // Validar que el partner exista
    const partner = await this.partnerRepository.findById(request.partnerId);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
    }

    // Generar código único de búsqueda rápida
    let quickSearchCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      quickSearchCode = generateTenantQuickSearchCode();
      const existingTenant = await this.tenantRepository.findByQuickSearchCode(quickSearchCode);
      if (!existingTenant) {
        break;
      }
      attempts++;
      if (attempts >= maxAttempts) {
        throw new BadRequestException(
          'Failed to generate unique quick search code after multiple attempts',
        );
      }
    } while (true);

    // Crear la entidad de dominio del tenant sin ID (la BD lo generará automáticamente)
    const tenant = Tenant.create(
      request.partnerId,
      request.name,
      request.category,
      request.currencyId,
      request.primaryColor,
      request.secondaryColor,
      quickSearchCode,
      request.pointsExpireDays || 365,
      request.minPointsToRedeem || 100,
      request.description || null,
      request.logo || null,
      request.banner || null,
      'active',
    );

    // Guardar el tenant (la BD asignará el ID automáticamente)
    const savedTenant = await this.tenantRepository.save(tenant);

    // Crear y guardar las características
    const features = TenantFeatures.create(
      savedTenant.id,
      request.qrScanning !== undefined ? request.qrScanning : true,
      request.offlineMode !== undefined ? request.offlineMode : true,
      request.referralProgram !== undefined ? request.referralProgram : true,
      request.birthdayRewards !== undefined ? request.birthdayRewards : true,
    );
    const featuresEntity = TenantMapper.featuresToPersistence(features);
    featuresEntity.tenantId = savedTenant.id;
    await this.featuresRepository.save(featuresEntity);

    // Recalcular subscription usage del partner afectado
    // Usar recálculo completo para asegurar que funcione incluso si no hay suscripción activa
    await SubscriptionUsageHelper.recalculateUsageForPartner(
      savedTenant.partnerId,
      this.subscriptionRepository,
      this.usageRepository,
      this.tenantEntityRepository,
      this.branchEntityRepository,
      this.customerMembershipRepository,
      true, // allowAnyStatus = true para actualizar incluso si la suscripción no está activa
    );

    // Retornar response DTO
    return new CreateTenantResponse(
      savedTenant.id,
      savedTenant.partnerId,
      savedTenant.name,
      savedTenant.category,
      savedTenant.status,
      savedTenant.createdAt,
    );
  }
}
