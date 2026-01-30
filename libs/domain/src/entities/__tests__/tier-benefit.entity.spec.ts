import { TierBenefit } from '../tier-benefit.entity';

describe('TierBenefit', () => {
  describe('create', () => {
    it('should create a valid tier benefit', () => {
      const benefit = TierBenefit.create(
        1, // programId
        2, // tierId
        1.25, // pointsMultiplier
        ['reward-1', 'reward-2'], // exclusiveRewards
        { maxPointsPerEvent: 1000 }, // higherCaps
        12, // cooldownReduction
        { 5: { pointsMultiplier: 1.5 } }, // categoryBenefits
        'active', // status
      );

      expect(benefit.programId).toBe(1);
      expect(benefit.tierId).toBe(2);
      expect(benefit.pointsMultiplier).toBe(1.25);
      expect(benefit.exclusiveRewards).toEqual(['reward-1', 'reward-2']);
      expect(benefit.higherCaps?.maxPointsPerEvent).toBe(1000);
      expect(benefit.cooldownReduction).toBe(12);
      expect(benefit.status).toBe('active');
    });

    it('should throw error if pointsMultiplier is negative', () => {
      expect(() => {
        TierBenefit.create(1, 2, -1);
      }).toThrow('Points multiplier must be positive');
    });

    it('should throw error if cooldownReduction is negative', () => {
      expect(() => {
        TierBenefit.create(1, 2, null, [], null, -1);
      }).toThrow('Cooldown reduction must be non-negative');
    });
  });

  describe('isActive', () => {
    it('should return true for active benefit', () => {
      const benefit = TierBenefit.create(1, 2, null, [], null, null, null, 'active');
      expect(benefit.isActive()).toBe(true);
    });

    it('should return false for inactive benefit', () => {
      const benefit = TierBenefit.create(1, 2, null, [], null, null, null, 'inactive');
      expect(benefit.isActive()).toBe(false);
    });
  });

  describe('applyMultiplier', () => {
    it('should apply multiplier if exists', () => {
      const benefit = TierBenefit.create(1, 2, 1.25);
      expect(benefit.applyMultiplier(100)).toBe(125); // 100 * 1.25 = 125
    });

    it('should return base points if multiplier is null', () => {
      const benefit = TierBenefit.create(1, 2, null);
      expect(benefit.applyMultiplier(100)).toBe(100);
    });
  });

  describe('isExclusiveReward', () => {
    it('should return true if reward is exclusive', () => {
      const benefit = TierBenefit.create(1, 2, null, ['reward-1', 'reward-2']);
      expect(benefit.isExclusiveReward('reward-1')).toBe(true);
    });

    it('should return false if reward is not exclusive', () => {
      const benefit = TierBenefit.create(1, 2, null, ['reward-1']);
      expect(benefit.isExclusiveReward('reward-99')).toBe(false);
    });
  });

  describe('getHigherCap', () => {
    it('should return higher cap for event', () => {
      const benefit = TierBenefit.create(1, 2, null, [], { maxPointsPerEvent: 1000 });
      expect(benefit.getHigherCap('event')).toBe(1000);
    });

    it('should return null if higherCaps is null', () => {
      const benefit = TierBenefit.create(1, 2, null, [], null);
      expect(benefit.getHigherCap('event')).toBeNull();
    });
  });

  describe('applyCooldownReduction', () => {
    it('should reduce cooldown hours', () => {
      const benefit = TierBenefit.create(1, 2, null, [], null, 12);
      expect(benefit.applyCooldownReduction(24)).toBe(12); // 24 - 12 = 12
    });

    it('should not go below 0', () => {
      const benefit = TierBenefit.create(1, 2, null, [], null, 30);
      expect(benefit.applyCooldownReduction(20)).toBe(0); // 20 - 30 = 0 (no negativo)
    });

    it('should return original if cooldownReduction is null', () => {
      const benefit = TierBenefit.create(1, 2, null, [], null, null);
      expect(benefit.applyCooldownReduction(24)).toBe(24);
    });
  });
});
