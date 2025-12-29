import { CustomerMembership } from '@libs/domain';
import { CustomerMembershipEntity } from '../entities/customer-membership.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class CustomerMembershipMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: CustomerMembershipEntity): CustomerMembership {
    return new CustomerMembership(
      persistenceEntity.id,
      persistenceEntity.userId,
      persistenceEntity.tenantId,
      persistenceEntity.registrationBranchId,
      persistenceEntity.points ?? 0,
      persistenceEntity.tierId,
      Number(persistenceEntity.totalSpent) ?? 0,
      persistenceEntity.totalVisits ?? 0,
      persistenceEntity.lastVisit,
      persistenceEntity.joinedDate,
      persistenceEntity.qrCode,
      persistenceEntity.status ?? 'active',
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   */
  static toPersistence(domainEntity: CustomerMembership): CustomerMembershipEntity {
    const entity = new CustomerMembershipEntity();
    // Solo asignar ID si es mayor a 0 (membership existente)
    // Si es 0, la BD generará el ID automáticamente
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.userId = domainEntity.userId;
    entity.tenantId = domainEntity.tenantId;
    entity.registrationBranchId = domainEntity.registrationBranchId;
    entity.points = domainEntity.points;
    entity.tierId = domainEntity.tierId;
    entity.totalSpent = domainEntity.totalSpent;
    entity.totalVisits = domainEntity.totalVisits;
    entity.lastVisit = domainEntity.lastVisit;
    entity.joinedDate = domainEntity.joinedDate;
    entity.qrCode = domainEntity.qrCode;
    entity.status = domainEntity.status;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}

