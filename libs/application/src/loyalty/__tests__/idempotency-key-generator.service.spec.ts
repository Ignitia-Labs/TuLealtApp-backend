import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyKeyGenerator } from '../idempotency-key-generator.service';
import { RewardRule, LoyaltyEvent } from '@libs/domain';

describe('IdempotencyKeyGenerator', () => {
  let service: IdempotencyKeyGenerator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdempotencyKeyGenerator],
    }).compile();

    service = module.get<IdempotencyKeyGenerator>(IdempotencyKeyGenerator);
  });

  describe('generateKey', () => {
    const mockRule = RewardRule.create(
      1, // programId
      'Test Rule',
      'PURCHASE',
      { tenantId: 1, programId: 1 },
      {},
      { type: 'fixed', points: 100 },
      {},
      {
        conflictGroup: 'CG_PURCHASE_BASE',
        stackPolicy: 'EXCLUSIVE',
        priorityRank: 10,
      },
      { strategy: 'default' },
      'BASE_PURCHASE',
    );

    const mockEvent: LoyaltyEvent = {
      tenantId: 1,
      eventType: 'PURCHASE',
      sourceEventId: 'ORDER-123',
      occurredAt: new Date('2025-01-28T10:00:00Z'),
      membershipRef: { membershipId: 100 },
      payload: {
        orderId: 'ORDER-123',
        netAmount: 100,
        grossAmount: 120,
        currency: 'GTQ',
        items: [],
      },
    };

    it('should generate key with default strategy', () => {
      const key = service.generateKey(mockRule, mockEvent, 100);

      expect(key).toContain('loyalty:1:100:1:');
      expect(key).toContain('ORDER-123');
    });

    it('should generate key with per-day strategy', () => {
      const rule = RewardRule.create(
        1,
        'Test Rule',
        'VISIT',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 10 },
        {},
        {
          conflictGroup: 'CG_VISIT_DAILY',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 10,
        },
        {
          strategy: 'per-day',
          bucketTimezone: 'America/Guatemala',
        },
        'BASE_VISIT',
      );

      const key = service.generateKey(rule, mockEvent, 100);

      expect(key).toContain('loyalty:1:100:1:');
      expect(key).toContain('2025-01-28'); // Date bucket
    });

    it('should generate key with per-period strategy', () => {
      const rule = RewardRule.create(
        1,
        'Test Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 10,
        },
        {
          strategy: 'per-period',
          periodDays: 30,
          bucketTimezone: 'America/Guatemala',
        },
        'BASE_PURCHASE',
      );

      const key = service.generateKey(rule, mockEvent, 100);

      expect(key).toContain('loyalty:1:100:1:');
      expect(key).toContain('30d'); // Period indicator
    });

    it('should generate key with per-event strategy', () => {
      const rule = RewardRule.create(
        1,
        'Test Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 10,
        },
        { strategy: 'per-event' },
        'BASE_PURCHASE',
      );

      const key = service.generateKey(rule, mockEvent, 100);

      expect(key).toContain('loyalty:1:100:1:');
      expect(key).toContain('ORDER-123');
    });

    it('should generate consistent keys for same inputs', () => {
      const key1 = service.generateKey(mockRule, mockEvent, 100);
      const key2 = service.generateKey(mockRule, mockEvent, 100);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different sourceEventIds', () => {
      const event1: LoyaltyEvent = { ...mockEvent, sourceEventId: 'ORDER-123' };
      const event2: LoyaltyEvent = { ...mockEvent, sourceEventId: 'ORDER-456' };

      const key1 = service.generateKey(mockRule, event1, 100);
      const key2 = service.generateKey(mockRule, event2, 100);

      expect(key1).not.toBe(key2);
    });
  });
});
