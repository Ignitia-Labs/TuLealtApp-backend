import { Transaction } from '@libs/domain';
import { TransactionEntity } from '../entities/transaction.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class TransactionMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: TransactionEntity): Transaction {
    return new Transaction(
      persistenceEntity.id,
      persistenceEntity.userId,
      persistenceEntity.membershipId ?? null,
      persistenceEntity.type,
      persistenceEntity.points,
      persistenceEntity.description,
      persistenceEntity.metadata,
      persistenceEntity.status,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Transaction): TransactionEntity {
    const entity = new TransactionEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.userId = domainEntity.userId;
    entity.membershipId = domainEntity.membershipId ?? null;
    entity.type = domainEntity.type;
    entity.points = domainEntity.points;
    entity.description = domainEntity.description;
    entity.metadata = domainEntity.metadata;
    entity.status = domainEntity.status;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
