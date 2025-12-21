import { Currency } from '@libs/domain';
import { CurrencyEntity } from '../entities/currency.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de Currency
 */
export class CurrencyMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: CurrencyEntity): Currency {
    return Currency.create(
      persistenceEntity.code,
      persistenceEntity.name,
      persistenceEntity.symbol,
      persistenceEntity.symbolPosition,
      persistenceEntity.decimalPlaces,
      persistenceEntity.status,
      persistenceEntity.id,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Currency): CurrencyEntity {
    const entity = new CurrencyEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.code = domainEntity.code;
    entity.name = domainEntity.name;
    entity.symbol = domainEntity.symbol;
    entity.symbolPosition = domainEntity.symbolPosition;
    entity.decimalPlaces = domainEntity.decimalPlaces;
    entity.status = domainEntity.status;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }
}
