import { TierStatus } from '@libs/domain/entities/tier/tier-status.entity';

describe('TierStatus', () => {
  describe('create', () => {
    it('should create a valid tier status', () => {
      const status = TierStatus.create(1, 2, new Date(), null, null);

      expect(status.membershipId).toBe(1);
      expect(status.currentTierId).toBe(2);
      expect(status.graceUntil).toBeNull();
      expect(status.nextEvalAt).toBeNull();
    });

    it('should throw error if graceUntil is before since', () => {
      const since = new Date('2025-01-28');
      const graceUntil = new Date('2025-01-27');

      expect(() => {
        TierStatus.create(1, 2, since, graceUntil, null);
      }).toThrow('Grace period end date must be after start date');
    });

    it('should throw error if nextEvalAt is in the past', () => {
      const pastDate = new Date('2020-01-01');

      expect(() => {
        TierStatus.create(1, 2, new Date(), null, pastDate);
      }).toThrow('Next evaluation date must be in the future');
    });
  });

  describe('isInGracePeriod', () => {
    it('should return true if graceUntil is in the future', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Mañana
      const status = TierStatus.create(1, 2, new Date(), futureDate, null);
      expect(status.isInGracePeriod()).toBe(true);
    });

    it('should return false if graceUntil is null', () => {
      const status = TierStatus.create(1, 2, new Date(), null, null);
      expect(status.isInGracePeriod()).toBe(false);
    });

    it('should return false if graceUntil is in the past', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Ayer
      const status = TierStatus.create(1, 2, new Date(), pastDate, null);
      expect(status.isInGracePeriod()).toBe(false);
    });
  });

  describe('upgrade', () => {
    it('should create new status with upgraded tier', () => {
      const currentStatus = TierStatus.create(1, 1, new Date('2025-01-01'), null, null);
      const nextEvalAt = new Date('2025-02-01');
      const upgraded = currentStatus.upgrade(2, null, nextEvalAt);

      expect(upgraded.currentTierId).toBe(2);
      expect(upgraded.since.getTime()).toBeGreaterThan(currentStatus.since.getTime());
      expect(upgraded.nextEvalAt).toEqual(nextEvalAt);
    });

    it('should return same status if tier is already the same', () => {
      const currentStatus = TierStatus.create(1, 2, new Date(), null, null);
      const upgraded = currentStatus.upgrade(2, null, null);
      expect(upgraded.currentTierId).toBe(2);
    });
  });

  describe('downgrade', () => {
    it('should create new status with downgraded tier', () => {
      const currentStatus = TierStatus.create(1, 2, new Date('2025-01-01'), null, null);
      const nextEvalAt = new Date('2025-02-01');
      const downgraded = currentStatus.downgrade(1, null, nextEvalAt);

      expect(downgraded.currentTierId).toBe(1);
      expect(downgraded.since.getTime()).toBeGreaterThan(currentStatus.since.getTime());
    });

    it('should allow downgrade to null', () => {
      const currentStatus = TierStatus.create(1, 2, new Date(), null, null);
      const downgraded = currentStatus.downgrade(null, null, null);
      expect(downgraded.currentTierId).toBeNull();
    });
  });

  describe('updateNextEvalAt', () => {
    it('should update nextEvalAt', () => {
      const status = TierStatus.create(1, 2, new Date(), null, null);
      const nextEvalAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const updated = status.updateNextEvalAt(nextEvalAt);

      expect(updated.nextEvalAt).toEqual(nextEvalAt);
    });

    it('should throw error if nextEvalAt is in the past', () => {
      const status = TierStatus.create(1, 2, new Date(), null, null);
      const pastDate = new Date('2020-01-01');

      expect(() => {
        status.updateNextEvalAt(pastDate);
      }).toThrow('Next evaluation date must be in the future');
    });
  });

  describe('hasTier', () => {
    it('should return true if tier is assigned', () => {
      const status = TierStatus.create(1, 2, new Date(), null, null);
      expect(status.hasTier()).toBe(true);
    });

    it('should return false if tier is null', () => {
      const status = TierStatus.create(1, null, new Date(), null, null);
      expect(status.hasTier()).toBe(false);
    });
  });

  describe('daysInCurrentTier', () => {
    it('should calculate days correctly', () => {
      const since = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 días atrás
      const status = TierStatus.create(1, 2, since, null, null);
      const days = status.daysInCurrentTier();
      expect(days).toBe(10);
    });
  });
});
