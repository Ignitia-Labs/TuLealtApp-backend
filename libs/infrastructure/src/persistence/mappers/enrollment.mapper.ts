import { Enrollment } from '@libs/domain';
import { EnrollmentEntity } from '../entities/enrollment.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class EnrollmentMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: EnrollmentEntity): Enrollment {
    return new Enrollment(
      persistenceEntity.id,
      persistenceEntity.membershipId,
      persistenceEntity.programId,
      persistenceEntity.status as Enrollment['status'],
      persistenceEntity.effectiveFrom,
      persistenceEntity.effectiveTo,
      persistenceEntity.metadata,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   */
  static toPersistence(domainEntity: Enrollment): EnrollmentEntity {
    const entity = new EnrollmentEntity();
    // Solo asignar ID si es mayor a 0 (enrollment existente)
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.membershipId = domainEntity.membershipId;
    entity.programId = domainEntity.programId;
    entity.status = domainEntity.status;
    entity.effectiveFrom = domainEntity.effectiveFrom;
    entity.effectiveTo = domainEntity.effectiveTo;
    entity.metadata = domainEntity.metadata as Record<string, any> | null;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
