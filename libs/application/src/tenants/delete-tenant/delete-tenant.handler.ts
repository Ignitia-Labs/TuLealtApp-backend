import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository, IPartnerRepository } from '@libs/domain';
import { DeleteTenantRequest } from './delete-tenant.request';
import { DeleteTenantResponse } from './delete-tenant.response';

/**
 * Handler para el caso de uso de eliminar un tenant
 */
@Injectable()
export class DeleteTenantHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
  ) {}

  async execute(request: DeleteTenantRequest): Promise<DeleteTenantResponse> {
    // Verificar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Guardar el partnerId antes de eliminar
    const partnerId = tenant.partnerId;

    // Eliminar el tenant (las características se eliminan en cascada por la relación)
    await this.tenantRepository.delete(request.tenantId);

    // Actualizar las estadísticas del partner
    await this.partnerRepository.updateStats(partnerId);

    return new DeleteTenantResponse('Tenant deleted successfully', request.tenantId);
  }
}

