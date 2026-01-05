import { CustomerPartner } from '@libs/domain';
import { CustomerPartnerEntity } from '../entities/customer-partner.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class CustomerPartnerMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: CustomerPartnerEntity): CustomerPartner {
    return new CustomerPartner(
      persistenceEntity.id,
      persistenceEntity.userId,
      persistenceEntity.partnerId,
      persistenceEntity.tenantId,
      persistenceEntity.registrationBranchId,
      persistenceEntity.status as 'active' | 'inactive' | 'suspended',
      persistenceEntity.joinedDate,
      persistenceEntity.lastActivityDate,
      persistenceEntity.metadata,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   */
  static toPersistence(domainEntity: CustomerPartner): CustomerPartnerEntity {
    const entity = new CustomerPartnerEntity();
    // Solo asignar ID si es mayor a 0 (asociación existente)
    // Si es 0, la BD generará el ID automáticamente
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.userId = domainEntity.userId;
    entity.partnerId = domainEntity.partnerId;
    entity.tenantId = domainEntity.tenantId;
    entity.registrationBranchId = domainEntity.registrationBranchId;
    entity.status = domainEntity.status;
    entity.joinedDate = domainEntity.joinedDate;
    entity.lastActivityDate = domainEntity.lastActivityDate;
    entity.metadata = domainEntity.metadata;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
