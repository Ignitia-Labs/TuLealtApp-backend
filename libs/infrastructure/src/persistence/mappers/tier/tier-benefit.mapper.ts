import { TierBenefit } from '@libs/domain';
import { TierBenefitEntity } from '@libs/infrastructure/entities/tier/tier-benefit.entity';
import { TierBenefitExclusiveRewardEntity } from '@libs/infrastructure/entities/tier/tier-benefit-exclusive-reward.entity';
import { TierBenefitCategoryBenefitEntity } from '@libs/infrastructure/entities/tier/tier-benefit-category-benefit.entity';
import { TierBenefitCategoryExclusiveRewardEntity } from '@libs/infrastructure/entities/tier/tier-benefit-category-exclusive-reward.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class TierBenefitMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   * Usa las columnas y tablas relacionadas como fuente de verdad
   */
  static toDomain(persistenceEntity: TierBenefitEntity): TierBenefit {
    // Construir exclusiveRewards desde tabla relacionada
    const exclusiveRewards: string[] =
      persistenceEntity.exclusiveRewardsRelation?.length > 0
        ? persistenceEntity.exclusiveRewardsRelation.map((r) => r.rewardId)
        : [];

    // Construir higherCaps desde columnas directas
    const higherCaps =
      persistenceEntity.higherCapsMaxPointsPerEvent !== null ||
      persistenceEntity.higherCapsMaxPointsPerDay !== null ||
      persistenceEntity.higherCapsMaxPointsPerMonth !== null
        ? {
            maxPointsPerEvent: persistenceEntity.higherCapsMaxPointsPerEvent ?? undefined,
            maxPointsPerDay: persistenceEntity.higherCapsMaxPointsPerDay ?? undefined,
            maxPointsPerMonth: persistenceEntity.higherCapsMaxPointsPerMonth ?? undefined,
          }
        : null;

    // Construir categoryBenefits desde tabla relacionada
    const categoryBenefits =
      persistenceEntity.categoryBenefitsRelation?.length > 0
        ? this.buildCategoryBenefitsFromRelation(persistenceEntity.categoryBenefitsRelation)
        : null;

    return TierBenefit.create(
      persistenceEntity.programId,
      persistenceEntity.tierId,
      persistenceEntity.pointsMultiplier,
      exclusiveRewards,
      higherCaps,
      persistenceEntity.cooldownReduction,
      categoryBenefits,
      persistenceEntity.status,
      persistenceEntity.id,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Construye las relaciones desde los datos del dominio
   */
  static toPersistence(domainEntity: TierBenefit): Partial<TierBenefitEntity> {
    const entity: Partial<TierBenefitEntity> = {};

    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.programId = domainEntity.programId;
    entity.tierId = domainEntity.tierId;
    entity.pointsMultiplier = domainEntity.pointsMultiplier;
    entity.cooldownReduction = domainEntity.cooldownReduction;
    entity.status = domainEntity.status;

    if (domainEntity.id > 0) {
      entity.createdAt = domainEntity.createdAt;
      entity.updatedAt = domainEntity.updatedAt;
    }

    // Mapear higherCaps a columnas directas
    if (domainEntity.higherCaps) {
      entity.higherCapsMaxPointsPerEvent = domainEntity.higherCaps.maxPointsPerEvent ?? null;
      entity.higherCapsMaxPointsPerDay = domainEntity.higherCaps.maxPointsPerDay ?? null;
      entity.higherCapsMaxPointsPerMonth = domainEntity.higherCaps.maxPointsPerMonth ?? null;
    } else {
      entity.higherCapsMaxPointsPerEvent = null;
      entity.higherCapsMaxPointsPerDay = null;
      entity.higherCapsMaxPointsPerMonth = null;
    }

    // Construir exclusiveRewardsRelation desde exclusiveRewards del dominio
    // TypeORM manejará el guardado mediante cascade: true
    const tierBenefitId = domainEntity.id || 0; // Usar 0 si es nuevo, TypeORM lo actualizará después
    if (domainEntity.exclusiveRewards && domainEntity.exclusiveRewards.length > 0) {
      entity.exclusiveRewardsRelation = domainEntity.exclusiveRewards.map((rewardId) => {
        const rewardEntity = new TierBenefitExclusiveRewardEntity();
        rewardEntity.tierBenefitId = tierBenefitId;
        rewardEntity.rewardId = rewardId;
        return rewardEntity;
      });
    } else {
      entity.exclusiveRewardsRelation = [];
    }

    // Construir categoryBenefitsRelation desde categoryBenefits del dominio
    if (domainEntity.categoryBenefits) {
      entity.categoryBenefitsRelation = Object.entries(domainEntity.categoryBenefits).map(
        ([categoryId, benefits]) => {
          const categoryBenefitEntity = new TierBenefitCategoryBenefitEntity();
          categoryBenefitEntity.tierBenefitId = tierBenefitId;
          categoryBenefitEntity.categoryId = parseInt(categoryId, 10);
          categoryBenefitEntity.pointsMultiplier = benefits.pointsMultiplier ?? null;

          // Construir exclusiveRewardsRelation para esta categoría
          if (benefits.exclusiveRewards && benefits.exclusiveRewards.length > 0) {
            const categoryBenefitId = 0; // Será actualizado por TypeORM después de guardar
            categoryBenefitEntity.exclusiveRewardsRelation = benefits.exclusiveRewards.map(
              (rewardId) => {
                const exclusiveRewardEntity = new TierBenefitCategoryExclusiveRewardEntity();
                exclusiveRewardEntity.categoryBenefitId = categoryBenefitId;
                exclusiveRewardEntity.rewardId = rewardId;
                return exclusiveRewardEntity;
              },
            );
          } else {
            categoryBenefitEntity.exclusiveRewardsRelation = [];
          }

          return categoryBenefitEntity;
        },
      );
    } else {
      entity.categoryBenefitsRelation = [];
    }

    return entity;
  }

  /**
   * Construye CategoryBenefits desde la relación de categoryBenefitsRelation
   */
  private static buildCategoryBenefitsFromRelation(
    categoryBenefitsRelation: TierBenefitCategoryBenefitEntity[],
  ): Record<number, { pointsMultiplier?: number; exclusiveRewards?: string[] }> {
    const categoryBenefits: Record<
      number,
      { pointsMultiplier?: number; exclusiveRewards?: string[] }
    > = {};

    for (const categoryBenefit of categoryBenefitsRelation) {
      const exclusiveRewards =
        categoryBenefit.exclusiveRewardsRelation?.map((r) => r.rewardId) ?? [];

      categoryBenefits[categoryBenefit.categoryId] = {
        pointsMultiplier: categoryBenefit.pointsMultiplier ?? undefined,
        exclusiveRewards: exclusiveRewards.length > 0 ? exclusiveRewards : undefined,
      };
    }

    return categoryBenefits;
  }
}
