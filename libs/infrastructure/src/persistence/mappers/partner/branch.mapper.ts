import { Branch } from '@libs/domain';
import { BranchEntity } from '@libs/infrastructure/entities/partner/branch.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de Branch
 */
export class BranchMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: BranchEntity): Branch {
    return Branch.create(
      persistenceEntity.tenantId,
      persistenceEntity.name,
      persistenceEntity.address,
      persistenceEntity.city,
      persistenceEntity.country,
      persistenceEntity.quickSearchCode,
      persistenceEntity.phone,
      persistenceEntity.email,
      persistenceEntity.status,
      persistenceEntity.id,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Branch): BranchEntity {
    const entity = new BranchEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.tenantId = domainEntity.tenantId;
    entity.name = domainEntity.name;
    entity.address = domainEntity.address;
    entity.city = domainEntity.city;
    entity.country = domainEntity.country;
    entity.quickSearchCode = domainEntity.quickSearchCode;
    entity.phone = domainEntity.phone;
    entity.email = domainEntity.email;
    entity.status = domainEntity.status;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }
}
