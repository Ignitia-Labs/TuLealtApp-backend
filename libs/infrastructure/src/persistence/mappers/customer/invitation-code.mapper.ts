import { InvitationCode } from '@libs/domain';
import { InvitationCodeEntity } from '@libs/infrastructure/entities/customer/invitation-code.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class InvitationCodeMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: InvitationCodeEntity): InvitationCode {
    return new InvitationCode(
      persistenceEntity.id,
      persistenceEntity.code,
      persistenceEntity.tenantId,
      persistenceEntity.branchId,
      persistenceEntity.type,
      persistenceEntity.maxUses,
      persistenceEntity.currentUses,
      persistenceEntity.expiresAt,
      persistenceEntity.status,
      persistenceEntity.createdBy,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: InvitationCode): InvitationCodeEntity {
    const entity = new InvitationCodeEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.code = domainEntity.code;
    entity.tenantId = domainEntity.tenantId;
    entity.branchId = domainEntity.branchId;
    entity.type = domainEntity.type;
    entity.maxUses = domainEntity.maxUses;
    entity.currentUses = domainEntity.currentUses;
    entity.expiresAt = domainEntity.expiresAt;
    entity.status = domainEntity.status;
    entity.createdBy = domainEntity.createdBy;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
