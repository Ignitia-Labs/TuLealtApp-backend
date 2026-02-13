import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository, Tenant, TenantFeatures } from '@libs/domain';
import { UpdateTenantRequest } from './update-tenant.request';
import { UpdateTenantResponse } from './update-tenant.response';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TenantFeaturesEntity,
  TenantMapper,
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  TenantEntity,
  BranchEntity,
  CustomerMembershipEntity,
} from '@libs/infrastructure';
import { SubscriptionUsageHelper } from '@libs/application';

/**
 * Handler para el caso de uso de actualizar un tenant
 * Permite actualización parcial (PATCH) de todos los campos
 */
@Injectable()
export class UpdateTenantHandler {
  constructor(
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

  async execute(tenantId: number, request: UpdateTenantRequest): Promise<UpdateTenantResponse> {
    // Buscar el tenant existente
    const existingTenant = await this.tenantRepository.findById(tenantId);

    if (!existingTenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Crear tenant actualizado con valores nuevos o existentes
    // Usar el constructor directamente para preservar createdAt y actualizar updatedAt
    const updatedTenant = new Tenant(
      existingTenant.id,
      existingTenant.partnerId, // No se puede cambiar el partnerId
      request.name ?? existingTenant.name,
      request.description !== undefined ? request.description : existingTenant.description,
      request.logo !== undefined ? request.logo : existingTenant.logo,
      request.banner !== undefined ? request.banner : existingTenant.banner,
      request.category ?? existingTenant.category,
      request.currencyId ?? existingTenant.currencyId,
      request.primaryColor ?? existingTenant.primaryColor,
      request.secondaryColor ?? existingTenant.secondaryColor,
      request.pointsExpireDays ?? existingTenant.pointsExpireDays,
      request.minPointsToRedeem ?? existingTenant.minPointsToRedeem,
      request.taxPercentage !== undefined ? request.taxPercentage : existingTenant.taxPercentage,
      request.redemptionCodeTtlMinutes !== undefined
        ? request.redemptionCodeTtlMinutes
        : existingTenant.redemptionCodeTtlMinutes,
      existingTenant.quickSearchCode, // No se puede cambiar el quickSearchCode
      request.status ?? existingTenant.status,
      existingTenant.createdAt, // Preservar fecha de creación
      new Date(), // Actualizar fecha de modificación
    );

    // Guardar el tenant actualizado
    const savedTenant = await this.tenantRepository.update(updatedTenant);

    // Actualizar características si se proporcionaron
    if (
      request.qrScanning !== undefined ||
      request.offlineMode !== undefined ||
      request.referralProgram !== undefined ||
      request.birthdayRewards !== undefined
    ) {
      // Buscar características existentes
      const existingFeaturesEntity = await this.featuresRepository.findOne({
        where: { tenantId: savedTenant.id },
      });

      if (existingFeaturesEntity) {
        // Actualizar características existentes
        const existingFeatures = TenantMapper.featuresToDomain(existingFeaturesEntity);
        const updatedFeatures = existingFeatures.updateFeatures(
          request.qrScanning,
          request.offlineMode,
          request.referralProgram,
          request.birthdayRewards,
        );
        const featuresEntity = TenantMapper.featuresToPersistence(updatedFeatures);
        featuresEntity.id = existingFeaturesEntity.id;
        featuresEntity.tenantId = savedTenant.id;
        await this.featuresRepository.save(featuresEntity);
      } else {
        // Crear características si no existen
        const features = TenantFeatures.create(
          savedTenant.id,
          request.qrScanning ?? true,
          request.offlineMode ?? true,
          request.referralProgram ?? true,
          request.birthdayRewards ?? true,
        );
        const featuresEntity = TenantMapper.featuresToPersistence(features);
        featuresEntity.tenantId = savedTenant.id;
        await this.featuresRepository.save(featuresEntity);
      }
    }

    // Obtener el tenant actualizado con todas sus relaciones
    const finalTenant = await this.tenantRepository.findById(savedTenant.id);

    if (!finalTenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found after update`);
    }

    // Recalcular subscription usage del partner afectado
    // Permitir cualquier status de suscripción para asegurar que se actualice correctamente
    await SubscriptionUsageHelper.recalculateUsageForPartner(
      finalTenant.partnerId,
      this.subscriptionRepository,
      this.usageRepository,
      this.tenantEntityRepository,
      this.branchEntityRepository,
      this.customerMembershipRepository,
      true, // allowAnyStatus = true para actualizar incluso si la suscripción no está activa
    );

    // Retornar response DTO
    return new UpdateTenantResponse(
      finalTenant.id,
      finalTenant.partnerId,
      finalTenant.name,
      finalTenant.description,
      finalTenant.logo,
      finalTenant.banner,
      finalTenant.category,
      finalTenant.currencyId,
      finalTenant.primaryColor,
      finalTenant.secondaryColor,
      finalTenant.pointsExpireDays,
      finalTenant.minPointsToRedeem,
      finalTenant.taxPercentage,
      finalTenant.redemptionCodeTtlMinutes,
      finalTenant.status,
      finalTenant.createdAt,
      finalTenant.updatedAt,
    );
  }
}
