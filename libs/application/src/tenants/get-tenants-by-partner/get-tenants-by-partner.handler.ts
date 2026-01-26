import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository, ITenantRepository } from '@libs/domain';
import { GetTenantsByPartnerRequest } from './get-tenants-by-partner.request';
import { GetTenantsByPartnerResponse } from './get-tenants-by-partner.response';
import { GetTenantResponse } from '../get-tenant/get-tenant.response';
import { TenantFeaturesEntity } from '@libs/infrastructure';

/**
 * Handler para el caso de uso de obtener tenants por partner
 */
@Injectable()
export class GetTenantsByPartnerHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @InjectRepository(TenantFeaturesEntity)
    private readonly featuresRepository: Repository<TenantFeaturesEntity>,
  ) {}

  async execute(request: GetTenantsByPartnerRequest): Promise<GetTenantsByPartnerResponse> {
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

    // Convertir a DTOs de respuesta con features
    const tenantResponses = tenants.map((tenant) => {
      const featuresEntity = featuresMap.get(tenant.id);

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
        tenant.quickSearchCode,
        tenant.status,
        tenant.createdAt,
        tenant.updatedAt,
        qrScanning,
        offlineMode,
        referralProgram,
        birthdayRewards,
      );
    });

    return new GetTenantsByPartnerResponse(tenantResponses);
  }
}
