import { PartnerStaffAssignment } from '@libs/domain';
import { PartnerStaffAssignmentEntity } from '../entities/partner-staff-assignment.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class PartnerStaffAssignmentMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: PartnerStaffAssignmentEntity): PartnerStaffAssignment {
    return new PartnerStaffAssignment(
      persistenceEntity.id,
      persistenceEntity.partnerId,
      persistenceEntity.staffUserId,
      Number(persistenceEntity.commissionPercent),
      persistenceEntity.isActive,
      persistenceEntity.startDate,
      persistenceEntity.endDate,
      persistenceEntity.notes,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   */
  static toPersistence(domainEntity: PartnerStaffAssignment): PartnerStaffAssignmentEntity {
    const entity = new PartnerStaffAssignmentEntity();
    // Solo asignar ID si es mayor a 0 (asignación existente)
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.partnerId = domainEntity.partnerId;
    entity.staffUserId = domainEntity.staffUserId;
    entity.commissionPercent = domainEntity.commissionPercent;
    entity.isActive = domainEntity.isActive;
    entity.startDate = domainEntity.startDate;
    entity.endDate = domainEntity.endDate;
    entity.notes = domainEntity.notes;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
