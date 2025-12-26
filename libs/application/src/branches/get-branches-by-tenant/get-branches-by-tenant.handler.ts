import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository, IBranchRepository } from '@libs/domain';
import { GetBranchesByTenantRequest } from './get-branches-by-tenant.request';
import { GetBranchesByTenantResponse } from './get-branches-by-tenant.response';
import { GetBranchResponse } from '../get-branch/get-branch.response';

/**
 * Handler para el caso de uso de obtener branches por tenant
 */
@Injectable()
export class GetBranchesByTenantHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(request: GetBranchesByTenantRequest): Promise<GetBranchesByTenantResponse> {
    // Verificar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Obtener todas las branches del tenant
    const branches = await this.branchRepository.findByTenantId(request.tenantId);

    // Convertir a DTOs de respuesta
    const branchResponses = branches.map(
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
          branch.status,
          branch.createdAt,
          branch.updatedAt,
        ),
    );

    return new GetBranchesByTenantResponse(branchResponses);
  }
}

