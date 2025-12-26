import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBranchRepository, Branch } from '@libs/domain';
import { UpdateBranchRequest } from './update-branch.request';
import { UpdateBranchResponse } from './update-branch.response';

/**
 * Handler para el caso de uso de actualizar una branch
 * Permite actualización parcial (PATCH) de todos los campos
 */
@Injectable()
export class UpdateBranchHandler {
  constructor(
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(branchId: number, request: UpdateBranchRequest): Promise<UpdateBranchResponse> {
    // Buscar la branch existente
    const existingBranch = await this.branchRepository.findById(branchId);

    if (!existingBranch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    // Crear branch actualizada con valores nuevos o existentes
    // Usar el constructor directamente para preservar createdAt y actualizar updatedAt
    const updatedBranch = new Branch(
      existingBranch.id,
      existingBranch.tenantId, // No se puede cambiar el tenantId
      request.name ?? existingBranch.name,
      request.address ?? existingBranch.address,
      request.city ?? existingBranch.city,
      request.country ?? existingBranch.country,
      request.phone !== undefined ? request.phone : existingBranch.phone,
      request.email !== undefined ? request.email : existingBranch.email,
      request.status ?? existingBranch.status,
      existingBranch.createdAt, // Preservar fecha de creación
      new Date(), // Actualizar fecha de modificación
    );

    // Guardar la branch actualizada
    const savedBranch = await this.branchRepository.update(updatedBranch);

    // Retornar response DTO
    return new UpdateBranchResponse(
      savedBranch.id,
      savedBranch.tenantId,
      savedBranch.name,
      savedBranch.address,
      savedBranch.city,
      savedBranch.country,
      savedBranch.phone,
      savedBranch.email,
      savedBranch.status,
      savedBranch.createdAt,
      savedBranch.updatedAt,
    );
  }
}

