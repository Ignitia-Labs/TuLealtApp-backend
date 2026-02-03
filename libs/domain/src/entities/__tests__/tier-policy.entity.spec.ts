import { TierPolicy } from '@libs/domain/entities/tier/tier-policy.entity';

describe('TierPolicy', () => {
  describe('create', () => {
    it('should create a valid tier policy', () => {
      const policy = TierPolicy.create(
        1, // tenantId
        'MONTHLY', // evaluationWindow
        'FIXED', // evaluationType
        { 1: 0, 2: 100, 3: 500 }, // thresholds
        30, // gracePeriodDays
        7, // minTierDuration
        'GRACE_PERIOD', // downgradeStrategy
        'Test policy', // description
        'active', // status
      );

      expect(policy.id).toBe(0); // Sin ID asignado aún
      expect(policy.tenantId).toBe(1);
      expect(policy.evaluationWindow).toBe('MONTHLY');
      expect(policy.evaluationType).toBe('FIXED');
      expect(policy.thresholds).toEqual({ 1: 0, 2: 100, 3: 500 });
      expect(policy.gracePeriodDays).toBe(30);
      expect(policy.minTierDuration).toBe(7);
      expect(policy.downgradeStrategy).toBe('GRACE_PERIOD');
      expect(policy.status).toBe('active');
    });

    it('should throw error if gracePeriodDays is negative', () => {
      expect(() => {
        TierPolicy.create(1, 'MONTHLY', 'FIXED', { 1: 0 }, -1);
      }).toThrow('Grace period days must be non-negative');
    });

    it('should throw error if minTierDuration is negative', () => {
      expect(() => {
        TierPolicy.create(1, 'MONTHLY', 'FIXED', { 1: 0 }, 30, -1);
      }).toThrow('Minimum tier duration must be non-negative');
    });

    it('should throw error if thresholds is empty', () => {
      expect(() => {
        TierPolicy.create(1, 'MONTHLY', 'FIXED', {});
      }).toThrow('Thresholds must contain at least one tier');
    });

    it('should throw error if threshold value is negative', () => {
      expect(() => {
        TierPolicy.create(1, 'MONTHLY', 'FIXED', { 1: -10 });
      }).toThrow('Threshold for tier 1 must be non-negative');
    });
  });

  describe('isActive', () => {
    it('should return true for active policy', () => {
      const policy = TierPolicy.create(
        1,
        'MONTHLY',
        'FIXED',
        { 1: 0 },
        30,
        0,
        'GRACE_PERIOD',
        null,
        'active',
      );
      expect(policy.isActive()).toBe(true);
    });

    it('should return false for inactive policy', () => {
      const policy = TierPolicy.create(
        1,
        'MONTHLY',
        'FIXED',
        { 1: 0 },
        30,
        0,
        'GRACE_PERIOD',
        null,
        'inactive',
      );
      expect(policy.isActive()).toBe(false);
    });
  });

  describe('allowsDowngrade', () => {
    it('should return true if downgradeStrategy is not NEVER', () => {
      const policy = TierPolicy.create(1, 'MONTHLY', 'FIXED', { 1: 0 }, 30, 0, 'GRACE_PERIOD');
      expect(policy.allowsDowngrade()).toBe(true);
    });

    it('should return false if downgradeStrategy is NEVER', () => {
      const policy = TierPolicy.create(1, 'MONTHLY', 'FIXED', { 1: 0 }, 30, 0, 'NEVER');
      expect(policy.allowsDowngrade()).toBe(false);
    });
  });

  describe('usesGracePeriod', () => {
    it('should return true if downgradeStrategy is GRACE_PERIOD and gracePeriodDays > 0', () => {
      const policy = TierPolicy.create(1, 'MONTHLY', 'FIXED', { 1: 0 }, 30, 0, 'GRACE_PERIOD');
      expect(policy.usesGracePeriod()).toBe(true);
    });

    it('should return false if downgradeStrategy is IMMEDIATE', () => {
      const policy = TierPolicy.create(1, 'MONTHLY', 'FIXED', { 1: 0 }, 30, 0, 'IMMEDIATE');
      expect(policy.usesGracePeriod()).toBe(false);
    });

    it('should return false if gracePeriodDays is 0', () => {
      const policy = TierPolicy.create(1, 'MONTHLY', 'FIXED', { 1: 0 }, 0, 0, 'GRACE_PERIOD');
      expect(policy.usesGracePeriod()).toBe(false);
    });
  });

  describe('getMinPointsForTier', () => {
    it('should return min points for existing tier', () => {
      const policy = TierPolicy.create(1, 'MONTHLY', 'FIXED', { 1: 0, 2: 100, 3: 500 });
      expect(policy.getMinPointsForTier(2)).toBe(100);
    });

    it('should return null for non-existing tier', () => {
      const policy = TierPolicy.create(1, 'MONTHLY', 'FIXED', { 1: 0, 2: 100 });
      expect(policy.getMinPointsForTier(99)).toBeNull();
    });
  });

  describe('hasTier', () => {
    it('should return true for existing tier', () => {
      const policy = TierPolicy.create(1, 'MONTHLY', 'FIXED', { 1: 0, 2: 100 });
      expect(policy.hasTier(2)).toBe(true);
    });

    it('should return false for non-existing tier', () => {
      const policy = TierPolicy.create(1, 'MONTHLY', 'FIXED', { 1: 0, 2: 100 });
      expect(policy.hasTier(99)).toBe(false);
    });
  });

  describe('getTiersOrderedByPoints', () => {
    it('should return tiers ordered by min points ascending', () => {
      const policy = TierPolicy.create(1, 'MONTHLY', 'FIXED', { 3: 500, 1: 0, 2: 100 });
      const ordered = policy.getTiersOrderedByPoints();
      expect(ordered).toEqual([1, 2, 3]);
    });
  });
});
