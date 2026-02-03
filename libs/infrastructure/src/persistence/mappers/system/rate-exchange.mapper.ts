import { RateExchange } from '@libs/domain';
import { RateExchangeEntity } from '@libs/infrastructure/entities/system/rate-exchange.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class RateExchangeMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: RateExchangeEntity): RateExchange {
    return new RateExchange(
      persistenceEntity.id,
      persistenceEntity.rate,
      persistenceEntity.fromCurrency,
      persistenceEntity.toCurrency,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   * createdAt y updatedAt son manejados automáticamente por TypeORM
   */
  static toPersistence(domainEntity: RateExchange): RateExchangeEntity {
    const entity = new RateExchangeEntity();
    // Solo asignar ID si es mayor a 0 (registro existente)
    // Si es 0, la BD generará el ID automáticamente
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.rate = domainEntity.rate;
    // Asegurar que las monedas tengan valores por defecto si no están definidas
    entity.fromCurrency = domainEntity.fromCurrency || 'GTQ';
    entity.toCurrency = domainEntity.toCurrency || 'USD';
    // createdAt y updatedAt son manejados automáticamente por @CreateDateColumn() y @UpdateDateColumn()
    // Solo asignarlos si la entidad ya existe (id > 0) para preservar las fechas originales
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    // Si es una nueva entidad (id === 0), no asignar createdAt ni updatedAt
    // TypeORM los manejará automáticamente con @CreateDateColumn() y @UpdateDateColumn()
    return entity;
  }
}
