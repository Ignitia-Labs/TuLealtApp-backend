import { SavedPaymentMethod } from '@libs/domain';
import { SavedPaymentMethodEntity } from '../entities/saved-payment-method.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class SavedPaymentMethodMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: SavedPaymentMethodEntity): SavedPaymentMethod {
    return new SavedPaymentMethod(
      persistenceEntity.id,
      persistenceEntity.partnerId,
      persistenceEntity.type,
      persistenceEntity.cardLastFour,
      persistenceEntity.cardBrand,
      persistenceEntity.cardExpiry,
      persistenceEntity.cardHolderName,
      persistenceEntity.bankName,
      persistenceEntity.accountLastFour,
      persistenceEntity.accountType,
      persistenceEntity.isDefault,
      persistenceEntity.isActive,
      persistenceEntity.gateway,
      persistenceEntity.gatewayCustomerId,
      persistenceEntity.gatewayPaymentMethodId,
      persistenceEntity.nickname,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
      persistenceEntity.lastUsedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: SavedPaymentMethod): SavedPaymentMethodEntity {
    const entity = new SavedPaymentMethodEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.partnerId = domainEntity.partnerId;
    entity.type = domainEntity.type;
    entity.cardLastFour = domainEntity.cardLastFour;
    entity.cardBrand = domainEntity.cardBrand;
    entity.cardExpiry = domainEntity.cardExpiry;
    entity.cardHolderName = domainEntity.cardHolderName;
    entity.bankName = domainEntity.bankName;
    entity.accountLastFour = domainEntity.accountLastFour;
    entity.accountType = domainEntity.accountType;
    entity.isDefault = domainEntity.isDefault;
    entity.isActive = domainEntity.isActive;
    entity.gateway = domainEntity.gateway;
    entity.gatewayCustomerId = domainEntity.gatewayCustomerId;
    entity.gatewayPaymentMethodId = domainEntity.gatewayPaymentMethodId;
    entity.nickname = domainEntity.nickname;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;
    entity.lastUsedAt = domainEntity.lastUsedAt;
    return entity;
  }
}
