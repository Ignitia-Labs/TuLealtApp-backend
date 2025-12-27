import { Injectable, Inject } from '@nestjs/common';
import { ICatalogRepository } from '@libs/domain';
import { GetCatalogsRequest } from './get-catalogs.request';
import { GetCatalogsResponse } from './get-catalogs.response';
import { CatalogSwaggerDto } from '../dto/catalog-swagger.dto';

/**
 * Handler para el caso de uso de obtener catálogos
 */
@Injectable()
export class GetCatalogsHandler {
  constructor(
    @Inject('ICatalogRepository')
    private readonly catalogRepository: ICatalogRepository,
  ) {}

  async execute(request: GetCatalogsRequest): Promise<GetCatalogsResponse> {
    let catalogs;

    if (request.type) {
      // Obtener catálogos por tipo
      catalogs = await this.catalogRepository.findByType(
        request.type,
        request.includeInactive || false,
      );
    } else {
      // Obtener todos los catálogos
      catalogs = await this.catalogRepository.findAll(request.includeInactive || false);
    }

    // Convertir a DTOs de respuesta
    const catalogDtos: CatalogSwaggerDto[] = catalogs.map(
      (catalog) =>
        new CatalogSwaggerDto(
          catalog.id,
          catalog.type,
          catalog.value,
          catalog.slug,
          catalog.displayOrder,
          catalog.isActive,
          catalog.createdAt,
          catalog.updatedAt,
        ),
    );

    return new GetCatalogsResponse(catalogDtos);
  }
}

