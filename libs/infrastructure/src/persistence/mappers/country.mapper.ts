import { Country } from '@libs/domain';
import { CountryEntity } from '../entities/country.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de Country
 */
export class CountryMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: CountryEntity): Country {
    return Country.create(
      persistenceEntity.name,
      persistenceEntity.currencyCode,
      persistenceEntity.code,
      persistenceEntity.status,
      persistenceEntity.id,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Country): CountryEntity {
    const entity = new CountryEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.name = domainEntity.name;
    entity.code = domainEntity.code;
    entity.currencyCode = domainEntity.currencyCode;
    entity.status = domainEntity.status;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }
}

