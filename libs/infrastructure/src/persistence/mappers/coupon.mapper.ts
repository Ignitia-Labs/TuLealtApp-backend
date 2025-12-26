import { Coupon } from '@libs/domain';
import { CouponEntity } from '../entities/coupon.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class CouponMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: CouponEntity): Coupon {
    return new Coupon(
      persistenceEntity.id,
      persistenceEntity.code,
      persistenceEntity.name,
      persistenceEntity.description,
      persistenceEntity.discountType,
      persistenceEntity.discountValue,
      persistenceEntity.currency,
      persistenceEntity.applicableFrequencies,
      persistenceEntity.maxUses,
      persistenceEntity.currentUses,
      persistenceEntity.maxUsesPerPartner,
      persistenceEntity.validFrom,
      persistenceEntity.validUntil,
      persistenceEntity.status,
      persistenceEntity.createdBy,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Coupon): CouponEntity {
    const entity = new CouponEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.code = domainEntity.code;
    entity.name = domainEntity.name;
    entity.description = domainEntity.description;
    entity.discountType = domainEntity.discountType;
    entity.discountValue = domainEntity.discountValue;
    entity.currency = domainEntity.currency;
    entity.applicableFrequencies = domainEntity.applicableFrequencies;
    entity.maxUses = domainEntity.maxUses;
    entity.currentUses = domainEntity.currentUses;
    entity.maxUsesPerPartner = domainEntity.maxUsesPerPartner;
    entity.validFrom = domainEntity.validFrom;
    entity.validUntil = domainEntity.validUntil;
    entity.status = domainEntity.status;
    entity.createdBy = domainEntity.createdBy;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    return entity;
  }
}
