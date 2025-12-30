import { Commission } from '@libs/domain';
import { CommissionEntity } from '../entities/commission.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class CommissionMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: CommissionEntity): Commission {
    return new Commission(
      persistenceEntity.id,
      persistenceEntity.partnerId,
      persistenceEntity.staffUserId,
      persistenceEntity.paymentId,
      persistenceEntity.subscriptionId,
      persistenceEntity.assignmentId,
      Number(persistenceEntity.paymentAmount),
      Number(persistenceEntity.commissionPercent),
      Number(persistenceEntity.commissionAmount),
      persistenceEntity.currency,
      persistenceEntity.paymentDate,
      persistenceEntity.status as 'pending' | 'paid' | 'cancelled',
      persistenceEntity.paidDate,
      persistenceEntity.notes,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   */
  static toPersistence(domainEntity: Commission): CommissionEntity {
    const entity = new CommissionEntity();
    // Solo asignar ID si es mayor a 0 (comisión existente)
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.partnerId = domainEntity.partnerId;
    entity.staffUserId = domainEntity.staffUserId;
    entity.paymentId = domainEntity.paymentId;
    entity.subscriptionId = domainEntity.subscriptionId;
    entity.assignmentId = domainEntity.assignmentId;
    entity.paymentAmount = domainEntity.paymentAmount;
    entity.commissionPercent = domainEntity.commissionPercent;
    entity.commissionAmount = domainEntity.commissionAmount;
    entity.currency = domainEntity.currency;
    entity.paymentDate = domainEntity.paymentDate;
    entity.status = domainEntity.status;
    entity.paidDate = domainEntity.paidDate;
    entity.notes = domainEntity.notes;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}

