import { PointsTransaction } from '@libs/domain/entities/loyalty/points-transaction.entity';

describe('PointsTransaction Entity', () => {
  const baseDate = new Date('2024-01-01T10:00:00Z');
  const expiresAt = new Date('2025-01-01T10:00:00Z');

  describe('createEarning', () => {
    it('should create an EARNING transaction with all required fields', () => {
      const transaction = PointsTransaction.createEarning(
        1, // tenantId
        100, // customerId
        50, // membershipId
        100, // pointsDelta
        'idempotency-key-123',
      );

      expect(transaction.type).toBe('EARNING');
      expect(transaction.pointsDelta).toBe(100);
      expect(transaction.tenantId).toBe(1);
      expect(transaction.customerId).toBe(100);
      expect(transaction.membershipId).toBe(50);
      expect(transaction.idempotencyKey).toBe('idempotency-key-123');
      expect(transaction.sourceEventId).toBeNull();
      expect(transaction.correlationId).toBeNull();
      expect(transaction.createdBy).toBeNull();
      expect(transaction.reasonCode).toBeNull();
      expect(transaction.programId).toBeNull();
      expect(transaction.rewardRuleId).toBeNull();
      expect(transaction.metadata).toBeNull();
      expect(transaction.reversalOfTransactionId).toBeNull();
      expect(transaction.expiresAt).toBeNull();
      expect(transaction.branchId).toBeNull();
      expect(transaction.createdAt).toBeInstanceOf(Date);
    });

    it('should create an EARNING transaction with optional fields', () => {
      const transaction = PointsTransaction.createEarning(
        1,
        100,
        50,
        200,
        'idempotency-key-456',
        'source-event-789',
        'correlation-123',
        'admin-user',
        'VISIT_BONUS',
        10, // programId
        5, // rewardRuleId
        { visitId: 123 },
        expiresAt,
        null, // branchId
        1, // id
      );

      expect(transaction.id).toBe(1);
      expect(transaction.type).toBe('EARNING');
      expect(transaction.pointsDelta).toBe(200);
      expect(transaction.sourceEventId).toBe('source-event-789');
      expect(transaction.correlationId).toBe('correlation-123');
      expect(transaction.createdBy).toBe('admin-user');
      expect(transaction.reasonCode).toBe('VISIT_BONUS');
      expect(transaction.programId).toBe(10);
      expect(transaction.rewardRuleId).toBe(5);
      expect(transaction.metadata).toEqual({ visitId: 123 });
      expect(transaction.expiresAt).toEqual(expiresAt);
      expect(transaction.branchId).toBeNull();
    });

    it('should create an EARNING transaction with branchId', () => {
      const transaction = PointsTransaction.createEarning(
        1,
        100,
        50,
        150,
        'idempotency-key-branch',
        'source-event-branch',
        null,
        'SYSTEM',
        'PURCHASE_BONUS',
        10,
        5,
        { orderId: 'ORD-123' },
        null,
        2, // branchId
      );

      expect(transaction.type).toBe('EARNING');
      expect(transaction.pointsDelta).toBe(150);
      expect(transaction.branchId).toBe(2);
      expect(transaction.sourceEventId).toBe('source-event-branch');
      expect(transaction.reasonCode).toBe('PURCHASE_BONUS');
      expect(transaction.metadata).toEqual({ orderId: 'ORD-123' });
    });

    it('should throw error if pointsDelta is not positive', () => {
      expect(() => {
        PointsTransaction.createEarning(1, 100, 50, 0, 'key');
      }).toThrow('EARNING transactions must have positive pointsDelta');

      expect(() => {
        PointsTransaction.createEarning(1, 100, 50, -10, 'key');
      }).toThrow('EARNING transactions must have positive pointsDelta');
    });
  });

  describe('createRedeem', () => {
    it('should create a REDEEM transaction', () => {
      const transaction = PointsTransaction.createRedeem(
        1,
        100,
        50,
        -50, // negative pointsDelta
        'idempotency-key-redeem',
        123, // rewardId (requerido)
      );

      expect(transaction.type).toBe('REDEEM');
      expect(transaction.pointsDelta).toBe(-50);
      expect(transaction.idempotencyKey).toBe('idempotency-key-redeem');
      expect(transaction.rewardId).toBe(123);
      expect(transaction.programId).toBeNull();
      expect(transaction.rewardRuleId).toBeNull();
      expect(transaction.branchId).toBeNull();
    });

    it('should create a REDEEM transaction with branchId', () => {
      const transaction = PointsTransaction.createRedeem(
        1,
        100,
        50,
        -75,
        'idempotency-key-redeem-branch',
        456, // rewardId
        'source-event-redeem',
        null,
        'USER_123',
        'REWARD_REDEMPTION',
        null,
        { rewardName: 'Free Coffee' },
        3, // branchId
      );

      expect(transaction.type).toBe('REDEEM');
      expect(transaction.pointsDelta).toBe(-75);
      expect(transaction.rewardId).toBe(456);
      expect(transaction.branchId).toBe(3);
      expect(transaction.createdBy).toBe('USER_123');
      expect(transaction.metadata).toEqual({ rewardName: 'Free Coffee' });
    });

    it('should throw error if pointsDelta is not negative', () => {
      expect(() => {
        PointsTransaction.createRedeem(1, 100, 50, 50, 'key', 123);
      }).toThrow('REDEEM transactions must have negative pointsDelta');

      expect(() => {
        PointsTransaction.createRedeem(1, 100, 50, 0, 'key', 123);
      }).toThrow('REDEEM transactions must have negative pointsDelta');
    });

    it('should throw error if rewardId is not provided or invalid', () => {
      expect(() => {
        PointsTransaction.createRedeem(1, 100, 50, -50, 'key', 0);
      }).toThrow('REDEEM transactions must have a valid rewardId');

      expect(() => {
        PointsTransaction.createRedeem(1, 100, 50, -50, 'key', -1);
      }).toThrow('REDEEM transactions must have a valid rewardId');
    });
  });

  describe('createReversal', () => {
    it('should create a REVERSAL transaction', () => {
      const transaction = PointsTransaction.createReversal(
        1,
        100,
        50,
        999, // reversalOfTransactionId
        'idempotency-key-reversal',
      );

      expect(transaction.type).toBe('REVERSAL');
      expect(transaction.pointsDelta).toBe(0);
      expect(transaction.reversalOfTransactionId).toBe(999);
      expect(transaction.programId).toBeNull();
      expect(transaction.rewardRuleId).toBeNull();
    });
  });

  describe('createAdjustment', () => {
    it('should create an ADJUSTMENT transaction with positive pointsDelta', () => {
      const transaction = PointsTransaction.createAdjustment(
        1,
        100,
        50,
        100,
        'idempotency-key-adjust',
        'admin-user',
        'MANUAL_ADJUSTMENT',
      );

      expect(transaction.type).toBe('ADJUSTMENT');
      expect(transaction.pointsDelta).toBe(100);
      expect(transaction.createdBy).toBe('admin-user');
      expect(transaction.reasonCode).toBe('MANUAL_ADJUSTMENT');
      expect(transaction.sourceEventId).toBeNull();
      expect(transaction.branchId).toBeNull();
    });

    it('should create an ADJUSTMENT transaction with negative pointsDelta', () => {
      const transaction = PointsTransaction.createAdjustment(
        1,
        100,
        50,
        -50,
        'idempotency-key-adjust',
        'admin-user',
        'MANUAL_ADJUSTMENT',
      );

      expect(transaction.type).toBe('ADJUSTMENT');
      expect(transaction.pointsDelta).toBe(-50);
    });

    it('should create an ADJUSTMENT transaction with branchId', () => {
      const transaction = PointsTransaction.createAdjustment(
        1,
        100,
        50,
        200,
        'idempotency-key-adjust-branch',
        'PARTNER_USER_456',
        'BONUS_BIRTHDAY',
        null, // correlationId
        { birthdayMonth: 3, appliedBy: 'Store Manager' },
        5, // branchId
      );

      expect(transaction.type).toBe('ADJUSTMENT');
      expect(transaction.pointsDelta).toBe(200);
      expect(transaction.createdBy).toBe('PARTNER_USER_456');
      expect(transaction.reasonCode).toBe('BONUS_BIRTHDAY');
      expect(transaction.branchId).toBe(5);
      expect(transaction.metadata).toEqual({ 
        birthdayMonth: 3, 
        appliedBy: 'Store Manager' 
      });
    });

    it('should throw error if pointsDelta is zero', () => {
      expect(() => {
        PointsTransaction.createAdjustment(1, 100, 50, 0, 'key', 'admin', 'REASON');
      }).toThrow('ADJUSTMENT transactions must have non-zero pointsDelta');
    });
  });

  describe('createExpiration', () => {
    it('should create an EXPIRATION transaction', () => {
      const transaction = PointsTransaction.createExpiration(
        1,
        100,
        50,
        -100, // negative pointsDelta
        'idempotency-key-expire',
      );

      expect(transaction.type).toBe('EXPIRATION');
      expect(transaction.pointsDelta).toBe(-100);
      expect(transaction.sourceEventId).toBeNull();
    });

    it('should throw error if pointsDelta is not negative', () => {
      expect(() => {
        PointsTransaction.createExpiration(1, 100, 50, 100, 'key');
      }).toThrow('EXPIRATION transactions must have negative pointsDelta');
    });
  });

  describe('createHold', () => {
    it('should create a HOLD transaction', () => {
      const transaction = PointsTransaction.createHold(
        1,
        100,
        50,
        -50, // negative pointsDelta
        'idempotency-key-hold',
      );

      expect(transaction.type).toBe('HOLD');
      expect(transaction.pointsDelta).toBe(-50);
    });

    it('should throw error if pointsDelta is not negative', () => {
      expect(() => {
        PointsTransaction.createHold(1, 100, 50, 50, 'key');
      }).toThrow('HOLD transactions must have negative pointsDelta');
    });
  });

  describe('createRelease', () => {
    it('should create a RELEASE transaction', () => {
      const transaction = PointsTransaction.createRelease(
        1,
        100,
        50,
        50, // positive pointsDelta
        'idempotency-key-release',
      );

      expect(transaction.type).toBe('RELEASE');
      expect(transaction.pointsDelta).toBe(50);
    });

    it('should throw error if pointsDelta is not positive', () => {
      expect(() => {
        PointsTransaction.createRelease(1, 100, 50, -50, 'key');
      }).toThrow('RELEASE transactions must have positive pointsDelta');
    });
  });

  describe('isEarning', () => {
    it('should return true for EARNING transactions', () => {
      const transaction = PointsTransaction.createEarning(1, 100, 50, 100, 'key');
      expect(transaction.isEarning()).toBe(true);
    });

    it('should return false for non-EARNING transactions', () => {
      const transaction = PointsTransaction.createRedeem(1, 100, 50, -50, 'key', 123);
      expect(transaction.isEarning()).toBe(false);
    });
  });

  describe('isRedeem', () => {
    it('should return true for REDEEM transactions', () => {
      const transaction = PointsTransaction.createRedeem(1, 100, 50, -50, 'key', 123);
      expect(transaction.isRedeem()).toBe(true);
    });

    it('should return false for non-REDEEM transactions', () => {
      const transaction = PointsTransaction.createEarning(1, 100, 50, 100, 'key');
      expect(transaction.isRedeem()).toBe(false);
    });
  });

  describe('isReversal', () => {
    it('should return true for REVERSAL transactions', () => {
      const transaction = PointsTransaction.createReversal(1, 100, 50, 999, 'key');
      expect(transaction.isReversal()).toBe(true);
    });

    it('should return false for non-REVERSAL transactions', () => {
      const transaction = PointsTransaction.createEarning(1, 100, 50, 100, 'key');
      expect(transaction.isReversal()).toBe(false);
    });
  });

  describe('hasExpiration', () => {
    it('should return true when expiresAt is set', () => {
      const transaction = PointsTransaction.createEarning(
        1,
        100,
        50,
        100,
        'key',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        expiresAt,
      );
      expect(transaction.hasExpiration()).toBe(true);
    });

    it('should return false when expiresAt is null', () => {
      const transaction = PointsTransaction.createEarning(1, 100, 50, 100, 'key');
      expect(transaction.hasExpiration()).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return true when expiresAt is in the past', () => {
      const pastDate = new Date('2020-01-01T10:00:00Z');
      const transaction = PointsTransaction.createEarning(
        1,
        100,
        50,
        100,
        'key',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        pastDate,
      );
      expect(transaction.isExpired()).toBe(true);
    });

    it('should return false when expiresAt is in the future', () => {
      const futureDate = new Date('2099-01-01T10:00:00Z');
      const transaction = PointsTransaction.createEarning(
        1,
        100,
        50,
        100,
        'key',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        futureDate,
      );
      expect(transaction.isExpired()).toBe(false);
    });

    it('should return false when expiresAt is null', () => {
      const transaction = PointsTransaction.createEarning(1, 100, 50, 100, 'key');
      expect(transaction.isExpired()).toBe(false);
    });
  });
});
