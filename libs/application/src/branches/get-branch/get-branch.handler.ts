import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBranchRepository } from '@libs/domain';
import { GetBranchRequest } from './get-branch.request';
import { GetBranchResponse } from './get-branch.response';

/**
 * Handler para el caso de uso de obtener una branch por ID
 */
@Injectable()
export class GetBranchHandler {
  constructor(
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(request: GetBranchRequest): Promise<GetBranchResponse> {
    const branch = await this.branchRepository.findById(request.branchId);

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${request.branchId} not found`);
    }

    return new GetBranchResponse(
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
    );
  }
}
