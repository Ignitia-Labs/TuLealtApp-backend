import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository, Tenant, TenantFeatures } from '@libs/domain';
import { UpdateTenantRequest } from './update-tenant.request';
import { UpdateTenantResponse } from './update-tenant.response';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantFeaturesEntity, TenantMapper } from '@libs/infrastructure';

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
      finalTenant.status,
      finalTenant.createdAt,
      finalTenant.updatedAt,
    );
  }
}
