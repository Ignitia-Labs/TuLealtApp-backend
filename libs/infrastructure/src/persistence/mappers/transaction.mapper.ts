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
      persistenceEntity.cashierId ?? null,
      persistenceEntity.transactionDate ?? null,
      persistenceEntity.transactionAmountTotal ?? null,
      persistenceEntity.netAmount ?? null,
      persistenceEntity.taxAmount ?? null,
      persistenceEntity.itemsCount ?? null,
      persistenceEntity.transactionReference ?? null,
      persistenceEntity.pointsEarned ?? null,
      persistenceEntity.pointsRuleId ?? null,
      persistenceEntity.pointsMultiplier ?? null,
      persistenceEntity.basePoints ?? null,
      persistenceEntity.bonusPoints ?? null,
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
    entity.cashierId = domainEntity.cashierId ?? null;
    entity.transactionDate = domainEntity.transactionDate ?? null;
    entity.transactionAmountTotal = domainEntity.transactionAmountTotal ?? null;
    entity.netAmount = domainEntity.netAmount ?? null;
    entity.taxAmount = domainEntity.taxAmount ?? null;
    entity.itemsCount = domainEntity.itemsCount ?? null;
    entity.transactionReference = domainEntity.transactionReference ?? null;
    entity.pointsEarned = domainEntity.pointsEarned ?? null;
    entity.pointsRuleId = domainEntity.pointsRuleId ?? null;
    entity.pointsMultiplier = domainEntity.pointsMultiplier ?? null;
    entity.basePoints = domainEntity.basePoints ?? null;
    entity.bonusPoints = domainEntity.bonusPoints ?? null;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
