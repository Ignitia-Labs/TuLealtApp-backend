import { Catalog } from '@libs/domain';
import { CatalogEntity } from '../entities/catalog.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de Catalog
 */
export class CatalogMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: CatalogEntity): Catalog {
    // Usar el constructor directamente para preservar las fechas
    return new Catalog(
      persistenceEntity.id,
      persistenceEntity.type,
      persistenceEntity.value,
      persistenceEntity.slug,
      persistenceEntity.displayOrder,
      persistenceEntity.isActive,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Catalog): CatalogEntity {
    const entity = new CatalogEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.type = domainEntity.type;
    entity.value = domainEntity.value;
    entity.slug = domainEntity.slug;
    entity.displayOrder = domainEntity.displayOrder;
    entity.isActive = domainEntity.isActive;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }
}
