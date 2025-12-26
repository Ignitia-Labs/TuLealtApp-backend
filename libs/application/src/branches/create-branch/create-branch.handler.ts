import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository, IBranchRepository, IPartnerRepository, Branch } from '@libs/domain';
import { CreateBranchRequest } from './create-branch.request';
import { CreateBranchResponse } from './create-branch.response';

/**
 * Handler para el caso de uso de crear una branch
 */
@Injectable()
export class CreateBranchHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
  ) {}

  async execute(request: CreateBranchRequest): Promise<CreateBranchResponse> {
    // Validar que el tenant exista
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Crear la entidad de dominio de la branch sin ID (la BD lo generará automáticamente)
    const branch = Branch.create(
      request.tenantId,
      request.name,
      request.address,
      request.city,
      request.country,
      request.phone || null,
      request.email || null,
      'active',
    );

    // Guardar la branch (la BD asignará el ID automáticamente)
    const savedBranch = await this.branchRepository.save(branch);

    // Actualizar las estadísticas del partner
    await this.partnerRepository.updateStats(tenant.partnerId);

    // Retornar response DTO
    return new CreateBranchResponse(
      savedBranch.id,
      savedBranch.tenantId,
      savedBranch.name,
      savedBranch.address,
      savedBranch.status,
      savedBranch.createdAt,
    );
  }
}
