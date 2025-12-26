import { PartnerRequest } from '@libs/domain';
import { PartnerRequestEntity } from '../entities/partner-request.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class PartnerRequestMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: PartnerRequestEntity): PartnerRequest {
    return new PartnerRequest(
      persistenceEntity.id,
      persistenceEntity.status,
      persistenceEntity.submittedAt,
      persistenceEntity.name,
      persistenceEntity.responsibleName,
      persistenceEntity.email,
      persistenceEntity.phone,
      persistenceEntity.countryId,
      persistenceEntity.city,
      persistenceEntity.plan,
      persistenceEntity.logo,
      persistenceEntity.category,
      persistenceEntity.branchesNumber,
      persistenceEntity.website,
      persistenceEntity.socialMedia,
      persistenceEntity.rewardType,
      persistenceEntity.currencyId,
      persistenceEntity.businessName,
      persistenceEntity.taxId,
      persistenceEntity.fiscalAddress,
      persistenceEntity.paymentMethod,
      persistenceEntity.billingEmail,
      persistenceEntity.notes,
      persistenceEntity.assignedTo,
      persistenceEntity.lastUpdated,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   */
  static toPersistence(domainEntity: PartnerRequest): PartnerRequestEntity {
    const entity = new PartnerRequestEntity();
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.status = domainEntity.status;
    entity.submittedAt = domainEntity.submittedAt;
    entity.name = domainEntity.name;
    entity.responsibleName = domainEntity.responsibleName;
    entity.email = domainEntity.email;
    entity.phone = domainEntity.phone;
    entity.countryId = domainEntity.countryId;
    entity.city = domainEntity.city;
    entity.plan = domainEntity.plan;
    entity.logo = domainEntity.logo;
    entity.category = domainEntity.category;
    entity.branchesNumber = domainEntity.branchesNumber;
    entity.website = domainEntity.website;
    entity.socialMedia = domainEntity.socialMedia;
    entity.rewardType = domainEntity.rewardType;
    entity.currencyId = domainEntity.currencyId;
    entity.businessName = domainEntity.businessName;
    entity.taxId = domainEntity.taxId;
    entity.fiscalAddress = domainEntity.fiscalAddress;
    entity.paymentMethod = domainEntity.paymentMethod;
    entity.billingEmail = domainEntity.billingEmail;
    entity.notes = domainEntity.notes;
    entity.assignedTo = domainEntity.assignedTo;
    entity.lastUpdated = domainEntity.lastUpdated;
    return entity;
  }
}
