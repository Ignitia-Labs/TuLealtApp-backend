import { TierBenefitMapper } from '../tier-benefit.mapper';
import { TierBenefitEntity } from '../../entities/tier-benefit.entity';
import { TierBenefitExclusiveRewardEntity } from '../../entities/tier-benefit-exclusive-reward.entity';
import { TierBenefitCategoryBenefitEntity } from '../../entities/tier-benefit-category-benefit.entity';
import { TierBenefitCategoryExclusiveRewardEntity } from '../../entities/tier-benefit-category-exclusive-reward.entity';
import { TierBenefit } from '@libs/domain';

describe('TierBenefitMapper', () => {
  const baseDate = new Date('2024-01-01T10:00:00Z');

  describe('toDomain', () => {
    it('should convert entity with relational columns to domain entity', () => {
      const entity = new TierBenefitEntity();
      entity.id = 1;
      entity.programId = 100;
      entity.tierId = 5;
      entity.pointsMultiplier = 1.25;
      entity.cooldownReduction = 12;
      entity.status = 'active';
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      // Columnas relacionales de higherCaps
      entity.higherCapsMaxPointsPerEvent = 1000;
      entity.higherCapsMaxPointsPerDay = 5000;
      entity.higherCapsMaxPointsPerMonth = 50000;

      // Relaciones vacías
      entity.exclusiveRewardsRelation = [];
      entity.categoryBenefitsRelation = [];

      const domain = TierBenefitMapper.toDomain(entity);

      expect(domain.id).toBe(1);
      expect(domain.programId).toBe(100);
      expect(domain.higherCaps).toEqual({
        maxPointsPerEvent: 1000,
        maxPointsPerDay: 5000,
        maxPointsPerMonth: 50000,
      });
      expect(domain.exclusiveRewards).toEqual([]);
    });

    it('should convert entity with exclusiveRewards relation to domain entity', () => {
      const entity = new TierBenefitEntity();
      entity.id = 2;
      entity.programId = 100;
      entity.tierId = 5;
      entity.pointsMultiplier = null;
      entity.cooldownReduction = null;
      entity.status = 'active';
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      entity.higherCapsMaxPointsPerEvent = null;
      entity.higherCapsMaxPointsPerDay = null;
      entity.higherCapsMaxPointsPerMonth = null;

      // Exclusive rewards desde relación
      const reward1 = new TierBenefitExclusiveRewardEntity();
      reward1.id = 1;
      reward1.tierBenefitId = 2;
      reward1.rewardId = 'reward-1';

      const reward2 = new TierBenefitExclusiveRewardEntity();
      reward2.id = 2;
      reward2.tierBenefitId = 2;
      reward2.rewardId = 'reward-2';

      entity.exclusiveRewardsRelation = [reward1, reward2];
      entity.categoryBenefitsRelation = [];

      const domain = TierBenefitMapper.toDomain(entity);

      expect(domain.exclusiveRewards).toEqual(['reward-1', 'reward-2']);
    });

    it('should convert entity with categoryBenefits relation to domain entity', () => {
      const entity = new TierBenefitEntity();
      entity.id = 3;
      entity.programId = 100;
      entity.tierId = 5;
      entity.pointsMultiplier = null;
      entity.cooldownReduction = null;
      entity.status = 'active';
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      entity.higherCapsMaxPointsPerEvent = null;
      entity.higherCapsMaxPointsPerDay = null;
      entity.higherCapsMaxPointsPerMonth = null;
      entity.exclusiveRewardsRelation = [];

      // Category benefits desde relación
      const categoryBenefit1 = new TierBenefitCategoryBenefitEntity();
      categoryBenefit1.id = 1;
      categoryBenefit1.tierBenefitId = 3;
      categoryBenefit1.categoryId = 10;
      categoryBenefit1.pointsMultiplier = 1.5;

      const exclusiveReward1 = new TierBenefitCategoryExclusiveRewardEntity();
      exclusiveReward1.id = 1;
      exclusiveReward1.categoryBenefitId = 1;
      exclusiveReward1.rewardId = 'category-reward-1';
      categoryBenefit1.exclusiveRewardsRelation = [exclusiveReward1];

      const categoryBenefit2 = new TierBenefitCategoryBenefitEntity();
      categoryBenefit2.id = 2;
      categoryBenefit2.tierBenefitId = 3;
      categoryBenefit2.categoryId = 20;
      categoryBenefit2.pointsMultiplier = null;
      categoryBenefit2.exclusiveRewardsRelation = [];

      entity.categoryBenefitsRelation = [categoryBenefit1, categoryBenefit2];

      const domain = TierBenefitMapper.toDomain(entity);

      expect(domain.categoryBenefits).toEqual({
        10: {
          pointsMultiplier: 1.5,
          exclusiveRewards: ['category-reward-1'],
        },
        20: {
          pointsMultiplier: undefined,
          exclusiveRewards: undefined,
        },
      });
    });

    it('should return empty arrays and null when relations are not loaded', () => {
      const entity = new TierBenefitEntity();
      entity.id = 4;
      entity.programId = 100;
      entity.tierId = 5;
      entity.pointsMultiplier = 1.1;
      entity.cooldownReduction = 6;
      entity.status = 'active';
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      // Simular que las relaciones no están cargadas
      entity.exclusiveRewardsRelation = [];
      entity.categoryBenefitsRelation = [];
      entity.higherCapsMaxPointsPerEvent = null;
      entity.higherCapsMaxPointsPerDay = null;
      entity.higherCapsMaxPointsPerMonth = null;

      const domain = TierBenefitMapper.toDomain(entity);

      expect(domain.exclusiveRewards).toEqual([]);
      expect(domain.higherCaps).toBeNull();
      expect(domain.categoryBenefits).toBeNull();
    });

    it('should handle null higherCaps and categoryBenefits', () => {
      const entity = new TierBenefitEntity();
      entity.id = 5;
      entity.programId = 100;
      entity.tierId = 5;
      entity.pointsMultiplier = null;
      entity.cooldownReduction = null;
      entity.status = 'active';
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      entity.exclusiveRewardsRelation = [];
      entity.categoryBenefitsRelation = [];
      entity.higherCapsMaxPointsPerEvent = null;
      entity.higherCapsMaxPointsPerDay = null;
      entity.higherCapsMaxPointsPerMonth = null;

      const domain = TierBenefitMapper.toDomain(entity);

      expect(domain.exclusiveRewards).toEqual([]);
      expect(domain.higherCaps).toBeNull();
      expect(domain.categoryBenefits).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('should convert domain entity to persistence entity', () => {
      const domain = TierBenefit.create(
        100,
        5,
        1.25,
        ['reward-1', 'reward-2'],
        {
          maxPointsPerEvent: 1000,
          maxPointsPerDay: 5000,
          maxPointsPerMonth: 50000,
        },
        12,
        {
          10: {
            pointsMultiplier: 1.5,
            exclusiveRewards: ['category-reward-1'],
          },
        },
        'active',
        1,
      );

      const entity = TierBenefitMapper.toPersistence(domain);

      expect(entity.id).toBe(1);
      expect(entity.programId).toBe(100);
      expect(entity.tierId).toBe(5);
      expect(entity.pointsMultiplier).toBe(1.25);
      expect(entity.higherCapsMaxPointsPerEvent).toBe(1000);
      expect(entity.higherCapsMaxPointsPerDay).toBe(5000);
      expect(entity.higherCapsMaxPointsPerMonth).toBe(50000);
      expect(entity.exclusiveRewardsRelation).toBeDefined();
      expect(entity.exclusiveRewardsRelation?.length).toBe(2);
      expect(entity.exclusiveRewardsRelation?.map((r) => r.rewardId)).toEqual([
        'reward-1',
        'reward-2',
      ]);
      expect(entity.categoryBenefitsRelation).toBeDefined();
      expect(entity.categoryBenefitsRelation?.length).toBe(1);
      expect(entity.categoryBenefitsRelation?.[0]?.categoryId).toBe(10);
      expect(entity.categoryBenefitsRelation?.[0]?.pointsMultiplier).toBe(1.5);
    });

    it('should not assign ID if domain ID is 0', () => {
      const domain = TierBenefit.create(100, 5, null, [], null, null, null, 'active');

      const entity = TierBenefitMapper.toPersistence(domain);

      expect(entity.id).toBeUndefined();
      expect(entity.programId).toBe(100);
    });

    it('should handle null higherCaps', () => {
      const domain = TierBenefit.create(100, 5, null, [], null, null, null, 'active', 1);

      const entity = TierBenefitMapper.toPersistence(domain);

      expect(entity.higherCapsMaxPointsPerEvent).toBeNull();
      expect(entity.higherCapsMaxPointsPerDay).toBeNull();
      expect(entity.higherCapsMaxPointsPerMonth).toBeNull();
    });
  });
});
