import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { ICatalogRepository, Catalog } from '@libs/domain';
import { generateSlug } from '@libs/shared';
import { CreateCatalogRequest } from './create-catalog.request';
import { CreateCatalogResponse } from './create-catalog.response';

/**
 * Handler para el caso de uso de crear un elemento de catálogo
 */
@Injectable()
export class CreateCatalogHandler {
  constructor(
    @Inject('ICatalogRepository')
    private readonly catalogRepository: ICatalogRepository,
  ) {}

  async execute(request: CreateCatalogRequest): Promise<CreateCatalogResponse> {
    // Generar slug si no se proporciona
    const slug = request.slug || generateSlug(request.value);

    // Verificar que no exista un elemento con el mismo tipo y valor
    const existingCatalogByValue = await this.catalogRepository.findByTypeAndValue(
      request.type,
      request.value,
    );

    if (existingCatalogByValue) {
      throw new ConflictException(
        `Catalog item with type '${request.type}' and value '${request.value}' already exists`,
      );
    }

    // Verificar que no exista un elemento con el mismo slug
    const existingCatalogBySlug = await this.catalogRepository.findBySlug(slug);

    if (existingCatalogBySlug) {
      throw new ConflictException(`Catalog item with slug '${slug}' already exists`);
    }

    // Crear el elemento de catálogo usando el factory method
    const catalog = Catalog.create(
      request.type,
      request.value,
      slug,
      request.displayOrder ?? 0,
      request.isActive ?? true,
    );

    // Guardar el catálogo
    const savedCatalog = await this.catalogRepository.save(catalog);

    // Retornar response DTO
    return new CreateCatalogResponse(
      savedCatalog.id,
      savedCatalog.type,
      savedCatalog.value,
      savedCatalog.slug,
      savedCatalog.displayOrder,
      savedCatalog.isActive,
      savedCatalog.createdAt,
      savedCatalog.updatedAt,
    );
  }
}

