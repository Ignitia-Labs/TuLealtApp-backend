import { PointsTransaction } from '@libs/domain';
import { PointsTransactionEntity } from '../entities/points-transaction.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class PointsTransactionMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: PointsTransactionEntity): PointsTransaction {
    return new PointsTransaction(
      persistenceEntity.id,
      persistenceEntity.tenantId,
      persistenceEntity.customerId,
      persistenceEntity.membershipId,
      persistenceEntity.programId,
      persistenceEntity.rewardRuleId,
      persistenceEntity.type as PointsTransaction['type'],
      persistenceEntity.pointsDelta,
      persistenceEntity.idempotencyKey,
      persistenceEntity.sourceEventId,
      persistenceEntity.correlationId,
      persistenceEntity.createdBy,
      persistenceEntity.reasonCode,
      persistenceEntity.metadata,
      persistenceEntity.reversalOfTransactionId,
      persistenceEntity.expiresAt,
      persistenceEntity.createdAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   */
  static toPersistence(domainEntity: PointsTransaction): PointsTransactionEntity {
    const entity = new PointsTransactionEntity();
    // Solo asignar ID si es mayor a 0 (transacción existente)
    // Si es 0, la BD generará el ID automáticamente
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.tenantId = domainEntity.tenantId;
    entity.customerId = domainEntity.customerId;
    entity.membershipId = domainEntity.membershipId;
    entity.programId = domainEntity.programId;
    entity.rewardRuleId = domainEntity.rewardRuleId;
    entity.type = domainEntity.type;
    entity.pointsDelta = domainEntity.pointsDelta;
    entity.idempotencyKey = domainEntity.idempotencyKey;
    entity.sourceEventId = domainEntity.sourceEventId;
    entity.correlationId = domainEntity.correlationId;
    entity.createdBy = domainEntity.createdBy;
    entity.reasonCode = domainEntity.reasonCode;
    entity.metadata = domainEntity.metadata as Record<string, any> | null;
    entity.reversalOfTransactionId = domainEntity.reversalOfTransactionId;
    entity.expiresAt = domainEntity.expiresAt;
    entity.createdAt = domainEntity.createdAt;
    return entity;
  }
}
