import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { ICatalogRepository, Catalog } from '@libs/domain';
import { generateSlug } from '@libs/shared';
import { UpdateCatalogRequest } from './update-catalog.request';
import { UpdateCatalogResponse } from './update-catalog.response';

/**
 * Handler para el caso de uso de actualizar un elemento de catálogo
 * Permite actualización parcial (PATCH) de todos los campos
 */
@Injectable()
export class UpdateCatalogHandler {
  constructor(
    @Inject('ICatalogRepository')
    private readonly catalogRepository: ICatalogRepository,
  ) {}

  async execute(catalogId: number, request: UpdateCatalogRequest): Promise<UpdateCatalogResponse> {
    // Buscar el elemento de catálogo existente
    const existingCatalog = await this.catalogRepository.findById(catalogId);

    if (!existingCatalog) {
      throw new NotFoundException(`Catalog with ID ${catalogId} not found`);
    }

    // Si se está actualizando el valor, verificar que no exista otro elemento con el mismo tipo y valor
    if (request.value && request.value !== existingCatalog.value) {
      const duplicateCatalog = await this.catalogRepository.findByTypeAndValue(
        existingCatalog.type,
        request.value,
      );

      if (duplicateCatalog) {
        throw new ConflictException(
          `Catalog item with type '${existingCatalog.type}' and value '${request.value}' already exists`,
        );
      }
    }

    // Determinar el slug a usar
    let newSlug: string | undefined;
    if (request.slug) {
      // Si se proporciona un slug explícito, verificar que no exista otro elemento con el mismo slug
      const duplicateBySlug = await this.catalogRepository.findBySlug(request.slug);
      if (duplicateBySlug && duplicateBySlug.id !== catalogId) {
        throw new ConflictException(`Catalog item with slug '${request.slug}' already exists`);
      }
      newSlug = request.slug;
    } else if (request.value && request.value !== existingCatalog.value) {
      // Si se actualiza el valor pero no el slug, generar uno nuevo desde el valor
      newSlug = generateSlug(request.value);
      // Verificar que el slug generado no exista
      const duplicateBySlug = await this.catalogRepository.findBySlug(newSlug);
      if (duplicateBySlug && duplicateBySlug.id !== catalogId) {
        throw new ConflictException(`Catalog item with slug '${newSlug}' already exists`);
      }
    }

    // Aplicar actualizaciones usando métodos de dominio
    let updatedCatalog = existingCatalog;

    if (request.value !== undefined && request.value !== existingCatalog.value) {
      updatedCatalog = updatedCatalog.updateValue(request.value, newSlug);
    }

    if (request.displayOrder !== undefined && request.displayOrder !== existingCatalog.displayOrder) {
      updatedCatalog = updatedCatalog.updateDisplayOrder(request.displayOrder);
    }

    if (request.isActive !== undefined && request.isActive !== existingCatalog.isActive) {
      updatedCatalog = request.isActive ? updatedCatalog.activate() : updatedCatalog.deactivate();
    }

    // Guardar el catálogo actualizado
    const savedCatalog = await this.catalogRepository.update(updatedCatalog);

    // Retornar response DTO
    return new UpdateCatalogResponse(
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

