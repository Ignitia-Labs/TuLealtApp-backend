import { Referral } from '@libs/domain';
import { ReferralEntity } from '../entities/referral.entity';

/**
 * Mapper para convertir entre entidad de dominio Referral y entidad de persistencia ReferralEntity
 */
export class ReferralMapper {
  /**
   * Convierte entidad de persistencia → entidad de dominio
   */
  static toDomain(entity: ReferralEntity): Referral {
    return new Referral(
      entity.id,
      entity.referrerMembershipId,
      entity.referredMembershipId,
      entity.tenantId,
      entity.status,
      entity.referralCode,
      entity.firstPurchaseCompleted,
      entity.rewardGranted,
      entity.rewardGrantedAt,
      entity.firstPurchaseCompletedAt,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Convierte entidad de dominio → entidad de persistencia
   */
  static toPersistence(domain: Referral): Partial<ReferralEntity> {
    return {
      id: domain.id || undefined,
      referrerMembershipId: domain.referrerMembershipId,
      referredMembershipId: domain.referredMembershipId,
      tenantId: domain.tenantId,
      status: domain.status,
      referralCode: domain.referralCode,
      firstPurchaseCompleted: domain.firstPurchaseCompleted,
      rewardGranted: domain.rewardGranted,
      rewardGrantedAt: domain.rewardGrantedAt,
      firstPurchaseCompletedAt: domain.firstPurchaseCompletedAt,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
