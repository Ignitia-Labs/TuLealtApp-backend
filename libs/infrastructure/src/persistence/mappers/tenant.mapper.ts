import { Tenant, TenantFeatures } from '@libs/domain';
import { TenantEntity } from '../entities/tenant.entity';
import { TenantFeaturesEntity } from '../entities/tenant-features.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de Tenant
 */
export class TenantMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: TenantEntity, features?: TenantFeaturesEntity | null): Tenant {
    return Tenant.create(
      persistenceEntity.partnerId,
      persistenceEntity.name,
      persistenceEntity.category,
      persistenceEntity.currencyId.toString(),
      persistenceEntity.primaryColor,
      persistenceEntity.secondaryColor,
      persistenceEntity.pointsExpireDays,
      persistenceEntity.minPointsToRedeem,
      persistenceEntity.description,
      persistenceEntity.logo,
      persistenceEntity.banner,
      persistenceEntity.status,
      persistenceEntity.id,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: Tenant): TenantEntity {
    const entity = new TenantEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.partnerId = domainEntity.partnerId;
    entity.name = domainEntity.name;
    entity.description = domainEntity.description;
    entity.logo = domainEntity.logo;
    entity.banner = domainEntity.banner;
    entity.category = domainEntity.category;
    entity.currencyId = parseInt(domainEntity.currencyId, 10) || 0;
    entity.primaryColor = domainEntity.primaryColor;
    entity.secondaryColor = domainEntity.secondaryColor;
    entity.pointsExpireDays = domainEntity.pointsExpireDays;
    entity.minPointsToRedeem = domainEntity.minPointsToRedeem;
    entity.status = domainEntity.status;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }

  /**
   * Convierte una entidad de persistencia de características a entidad de dominio
   */
  static featuresToDomain(persistenceEntity: TenantFeaturesEntity): TenantFeatures {
    return TenantFeatures.create(
      persistenceEntity.tenantId,
      persistenceEntity.qrScanning,
      persistenceEntity.offlineMode,
      persistenceEntity.referralProgram,
      persistenceEntity.birthdayRewards,
      persistenceEntity.id,
    );
  }

  /**
   * Convierte una entidad de dominio de características a entidad de persistencia
   */
  static featuresToPersistence(domainEntity: TenantFeatures): TenantFeaturesEntity {
    const entity = new TenantFeaturesEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.tenantId = domainEntity.tenantId;
    entity.qrScanning = domainEntity.qrScanning;
    entity.offlineMode = domainEntity.offlineMode;
    entity.referralProgram = domainEntity.referralProgram;
    entity.birthdayRewards = domainEntity.birthdayRewards;
    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }
    return entity;
  }
}
