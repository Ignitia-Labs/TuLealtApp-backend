import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICatalogRepository } from '@libs/domain';
import { GetCatalogRequest } from './get-catalog.request';
import { GetCatalogResponse } from './get-catalog.response';

/**
 * Handler para el caso de uso de obtener un catálogo por ID
 */
@Injectable()
export class GetCatalogHandler {
  constructor(
    @Inject('ICatalogRepository')
    private readonly catalogRepository: ICatalogRepository,
  ) {}

  async execute(request: GetCatalogRequest): Promise<GetCatalogResponse> {
    const catalog = await this.catalogRepository.findById(request.catalogId);

    if (!catalog) {
      throw new NotFoundException(`Catalog with ID ${request.catalogId} not found`);
    }

    return new GetCatalogResponse(
      catalog.id,
      catalog.type,
      catalog.value,
      catalog.slug,
      catalog.displayOrder,
      catalog.isActive,
      catalog.createdAt,
      catalog.updatedAt,
    );
  }
}
