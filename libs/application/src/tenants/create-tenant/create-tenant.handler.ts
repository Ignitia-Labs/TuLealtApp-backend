import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPartnerRepository, ITenantRepository, Tenant, TenantFeatures } from '@libs/domain';
import { CreateTenantRequest } from './create-tenant.request';
import { CreateTenantResponse } from './create-tenant.response';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantFeaturesEntity, TenantMapper } from '@libs/infrastructure';

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
  ) {}

  async execute(request: CreateTenantRequest): Promise<CreateTenantResponse> {
    // Validar que el partner exista
    const partner = await this.partnerRepository.findById(request.partnerId);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
    }

    // Crear la entidad de dominio del tenant sin ID (la BD lo generará automáticamente)
    const tenant = Tenant.create(
      request.partnerId,
      request.name,
      request.category,
      request.currencyId,
      request.primaryColor,
      request.secondaryColor,
      request.pointsExpireDays || 365,
      request.minPointsToRedeem || 100,
      request.description || null,
      request.logo || null,
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

    // Actualizar las estadísticas del partner
    await this.partnerRepository.updateStats(savedTenant.partnerId);

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
