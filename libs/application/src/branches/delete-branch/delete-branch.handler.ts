import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBranchRepository } from '@libs/domain';
import { DeleteBranchRequest } from './delete-branch.request';
import { DeleteBranchResponse } from './delete-branch.response';

/**
 * Handler para el caso de uso de eliminar una branch
 */
@Injectable()
export class DeleteBranchHandler {
  constructor(
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(request: DeleteBranchRequest): Promise<DeleteBranchResponse> {
    // Verificar que la branch existe
    const branch = await this.branchRepository.findById(request.branchId);

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${request.branchId} not found`);
    }

    // Eliminar la branch
    await this.branchRepository.delete(request.branchId);

    return new DeleteBranchResponse('Branch deleted successfully', request.branchId);
  }
}

