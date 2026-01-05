import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICatalogRepository } from '@libs/domain';
import { DeleteCatalogRequest } from './delete-catalog.request';
import { DeleteCatalogResponse } from './delete-catalog.response';

/**
 * Handler para el caso de uso de eliminar un elemento de catálogo
 */
@Injectable()
export class DeleteCatalogHandler {
  constructor(
    @Inject('ICatalogRepository')
    private readonly catalogRepository: ICatalogRepository,
  ) {}

  async execute(request: DeleteCatalogRequest): Promise<DeleteCatalogResponse> {
    // Verificar que el elemento de catálogo exista
    const existingCatalog = await this.catalogRepository.findById(request.catalogId);

    if (!existingCatalog) {
      throw new NotFoundException(`Catalog with ID ${request.catalogId} not found`);
    }

    // Eliminar el elemento de catálogo
    await this.catalogRepository.delete(request.catalogId);

    return new DeleteCatalogResponse('Catalog deleted successfully', request.catalogId);
  }
}
