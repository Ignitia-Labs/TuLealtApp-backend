import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository } from '@libs/domain';
import { GetTenantRequest } from './get-tenant.request';
import { GetTenantResponse } from './get-tenant.response';

/**
 * Handler para el caso de uso de obtener un tenant por ID
 */
@Injectable()
export class GetTenantHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: GetTenantRequest): Promise<GetTenantResponse> {
    const tenant = await this.tenantRepository.findById(request.tenantId);

    if (!tenant) {
      throw new NotFoundException(
        `Tenant with ID ${request.tenantId} not found`,
      );
    }

    return new GetTenantResponse(
      tenant.id,
      tenant.partnerId,
      tenant.name,
      tenant.description,
      tenant.logo,
      tenant.category,
      tenant.currencyId,
      tenant.primaryColor,
      tenant.secondaryColor,
      tenant.pointsExpireDays,
      tenant.minPointsToRedeem,
      tenant.status,
      tenant.createdAt,
      tenant.updatedAt,
    );
  }
}
