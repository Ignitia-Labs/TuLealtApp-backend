import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITenantRepository } from '@libs/domain';
import { GetTenantRequest } from './get-tenant.request';
import { GetTenantResponse } from './get-tenant.response';
import { TenantFeaturesEntity, TenantMapper } from '@libs/infrastructure';

/**
 * Handler para el caso de uso de obtener un tenant por ID
 */
@Injectable()
export class GetTenantHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @InjectRepository(TenantFeaturesEntity)
    private readonly featuresRepository: Repository<TenantFeaturesEntity>,
  ) {}

  async execute(request: GetTenantRequest): Promise<GetTenantResponse> {
    const tenant = await this.tenantRepository.findById(request.tenantId);

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Obtener las características del tenant
    const featuresEntity = await this.featuresRepository.findOne({
      where: { tenantId: tenant.id },
    });

    // Valores por defecto si no existen características
    const qrScanning = featuresEntity?.qrScanning ?? true;
    const offlineMode = featuresEntity?.offlineMode ?? true;
    const referralProgram = featuresEntity?.referralProgram ?? true;
    const birthdayRewards = featuresEntity?.birthdayRewards ?? true;

    return new GetTenantResponse(
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
      tenant.status,
      tenant.createdAt,
      tenant.updatedAt,
      qrScanning,
      offlineMode,
      referralProgram,
      birthdayRewards,
    );
  }
}
