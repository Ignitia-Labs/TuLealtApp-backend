import { RefreshToken } from '@libs/domain';
import { RefreshTokenEntity } from '@libs/infrastructure/entities/auth/refresh-token.entity';

/**
 * Mapper para convertir entre entidades de dominio RefreshToken
 * y entidades de persistencia RefreshTokenEntity
 */
export class RefreshTokenMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   * @param persistenceEntity Entidad TypeORM RefreshTokenEntity
   * @returns Entidad de dominio RefreshToken
   */
  static toDomain(persistenceEntity: RefreshTokenEntity): RefreshToken {
    if (!persistenceEntity) {
      throw new Error('Cannot map null or undefined RefreshTokenEntity to domain');
    }

    return new RefreshToken(
      persistenceEntity.id,
      persistenceEntity.userId,
      persistenceEntity.tokenHash,
      persistenceEntity.expiresAt,
      persistenceEntity.isRevoked,
      persistenceEntity.userAgent,
      persistenceEntity.ipAddress,
      persistenceEntity.createdAt,
      persistenceEntity.revokedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   * @param domainEntity Entidad de dominio RefreshToken
   * @returns Entidad de persistencia RefreshTokenEntity (parcial)
   */
  static toPersistence(domainEntity: RefreshToken): Partial<RefreshTokenEntity> {
    if (!domainEntity) {
      throw new Error('Cannot map null or undefined RefreshToken to persistence');
    }

    const entity: Partial<RefreshTokenEntity> = {};

    // Solo asignar ID si es mayor a 0 (token existente)
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }

    entity.userId = domainEntity.userId;
    entity.tokenHash = domainEntity.tokenHash;
    entity.expiresAt = domainEntity.expiresAt;
    entity.isRevoked = domainEntity.isRevoked;
    entity.userAgent = domainEntity.userAgent;
    entity.ipAddress = domainEntity.ipAddress;
    entity.createdAt = domainEntity.createdAt;
    entity.revokedAt = domainEntity.revokedAt;

    return entity;
  }

  /**
   * Convierte múltiples entidades de persistencia a dominio
   * @param persistenceEntities Array de RefreshTokenEntity
   * @returns Array de RefreshToken
   */
  static toDomainMany(persistenceEntities: RefreshTokenEntity[]): RefreshToken[] {
    if (!persistenceEntities) {
      return [];
    }

    return persistenceEntities.map((entity) => this.toDomain(entity));
  }
}
