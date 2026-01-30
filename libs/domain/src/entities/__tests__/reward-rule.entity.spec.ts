import { RewardRule } from '../reward-rule.entity';
import { BASE_EARNING_DOMAINS, BONUS_EARNING_DOMAINS } from '../../constants/earning-domains';
import {
  PURCHASE_CONFLICT_GROUPS,
  VISIT_CONFLICT_GROUPS,
  STACK_POLICIES,
} from '../../constants/conflict-groups';

describe('RewardRule Entity', () => {
  const baseDate = new Date('2024-01-01T10:00:00Z');
  const futureDate = new Date('2025-12-31T23:59:59Z');

  describe('create', () => {
    it('should create a reward rule with all required fields', () => {
      const rule = RewardRule.create(
        1, // programId
        'Base Purchase Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
      );

      expect(rule.programId).toBe(1);
      expect(rule.name).toBe('Base Purchase Rule');
      expect(rule.trigger).toBe('PURCHASE');
      expect(rule.status).toBe('draft');
      expect(rule.version).toBe(1);
      expect(rule.createdAt).toBeInstanceOf(Date);
      expect(rule.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a reward rule with optional fields', () => {
      const rule = RewardRule.create(
        1,
        'Visit Rule',
        'VISIT',
        { tenantId: 1, programId: 1, storeId: 5, channel: 'in-store' },
        { minTierId: 1, membershipStatus: ['active'] },
        { type: 'fixed', points: 10 },
        { frequency: 'daily', cooldownHours: 24 },
        {
          conflictGroup: VISIT_CONFLICT_GROUPS.CG_VISIT_DAILY,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 5,
        },
        {
          strategy: 'per-day',
          bucketTimezone: 'America/Guatemala',
        },
        BASE_EARNING_DOMAINS.BASE_VISIT,
        'Visit description',
        'active',
        2,
        baseDate,
        futureDate,
        1, // id
      );

      expect(rule.id).toBe(1);
      expect(rule.description).toBe('Visit description');
      expect(rule.status).toBe('active');
      expect(rule.version).toBe(2);
      expect(rule.activeFrom).toEqual(baseDate);
      expect(rule.activeTo).toEqual(futureDate);
      expect(rule.scope.storeId).toBe(5);
      expect(rule.scope.channel).toBe('in-store');
    });

    it('should throw error if conflictGroup is missing', () => {
      expect(() => {
        RewardRule.create(
          1,
          'Test Rule',
          'PURCHASE',
          { tenantId: 1, programId: 1 },
          {},
          { type: 'fixed', points: 100 },
          {},
          {
            conflictGroup: '' as any, // empty conflictGroup
            stackPolicy: STACK_POLICIES.EXCLUSIVE,
            priorityRank: 10,
          },
          { strategy: 'default' },
          BASE_EARNING_DOMAINS.BASE_PURCHASE,
        );
      }).toThrow('conflictGroup is required');
    });

    it('should throw error if conflictGroup is invalid (not from catalog)', () => {
      expect(() => {
        RewardRule.create(
          1,
          'Test Rule',
          'PURCHASE',
          { tenantId: 1, programId: 1 },
          {},
          { type: 'fixed', points: 100 },
          {},
          {
            conflictGroup: 'INVALID_GROUP' as any,
            stackPolicy: STACK_POLICIES.EXCLUSIVE,
            priorityRank: 10,
          },
          { strategy: 'default' },
          BASE_EARNING_DOMAINS.BASE_PURCHASE,
        );
      }).toThrow('Invalid conflictGroup');
    });

    it('should throw error if stackPolicy is missing', () => {
      expect(() => {
        RewardRule.create(
          1,
          'Test Rule',
          'PURCHASE',
          { tenantId: 1, programId: 1 },
          {},
          { type: 'fixed', points: 100 },
          {},
          {
            conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
            stackPolicy: '' as any, // empty stackPolicy
            priorityRank: 10,
          },
          { strategy: 'default' },
          BASE_EARNING_DOMAINS.BASE_PURCHASE,
        );
      }).toThrow('stackPolicy is required');
    });

    it('should throw error if stackPolicy is invalid', () => {
      expect(() => {
        RewardRule.create(
          1,
          'Test Rule',
          'PURCHASE',
          { tenantId: 1, programId: 1 },
          {},
          { type: 'fixed', points: 100 },
          {},
          {
            conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
            stackPolicy: 'INVALID_POLICY' as any,
            priorityRank: 10,
          },
          { strategy: 'default' },
          BASE_EARNING_DOMAINS.BASE_PURCHASE,
        );
      }).toThrow('Invalid stackPolicy');
    });

    it('should throw error if idempotencyScope.strategy is missing', () => {
      expect(() => {
        RewardRule.create(
          1,
          'Test Rule',
          'PURCHASE',
          { tenantId: 1, programId: 1 },
          {},
          { type: 'fixed', points: 100 },
          {},
          {
            conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
            stackPolicy: STACK_POLICIES.EXCLUSIVE,
            priorityRank: 10,
          },
          { strategy: '' as any },
          BASE_EARNING_DOMAINS.BASE_PURCHASE,
        );
      }).toThrow('idempotencyScope.strategy is required');
    });

    it('should throw error if earningDomain is missing', () => {
      expect(() => {
        RewardRule.create(
          1,
          'Test Rule',
          'PURCHASE',
          { tenantId: 1, programId: 1 },
          {},
          { type: 'fixed', points: 100 },
          {},
          {
            conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
            stackPolicy: STACK_POLICIES.EXCLUSIVE,
            priorityRank: 10,
          },
          { strategy: 'default' },
          '' as any,
        );
      }).toThrow('earningDomain is required');
    });

    it('should throw error if earningDomain is invalid', () => {
      expect(() => {
        RewardRule.create(
          1,
          'Test Rule',
          'PURCHASE',
          { tenantId: 1, programId: 1 },
          {},
          { type: 'fixed', points: 100 },
          {},
          {
            conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
            stackPolicy: STACK_POLICIES.EXCLUSIVE,
            priorityRank: 10,
          },
          { strategy: 'default' },
          'INVALID_DOMAIN' as any,
        );
      }).toThrow('Invalid earningDomain');
    });

    it('should throw error if priorityRank is negative', () => {
      expect(() => {
        RewardRule.create(
          1,
          'Test Rule',
          'PURCHASE',
          { tenantId: 1, programId: 1 },
          {},
          { type: 'fixed', points: 100 },
          {},
          {
            conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
            stackPolicy: STACK_POLICIES.EXCLUSIVE,
            priorityRank: -1,
          },
          { strategy: 'default' },
          BASE_EARNING_DOMAINS.BASE_PURCHASE,
        );
      }).toThrow('priorityRank must be non-negative');
    });

    it('should throw error if PURCHASE trigger has rate formula without amountField', () => {
      expect(() => {
        RewardRule.create(
          1,
          'Test Rule',
          'PURCHASE',
          { tenantId: 1, programId: 1 },
          {},
          {
            type: 'rate',
            rate: 0.1,
            roundingPolicy: 'floor',
            // missing amountField
          } as any,
          {},
          {
            conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
            stackPolicy: STACK_POLICIES.EXCLUSIVE,
            priorityRank: 10,
          },
          { strategy: 'default' },
          BASE_EARNING_DOMAINS.BASE_PURCHASE,
        );
      }).toThrow('PURCHASE trigger requires amountField');
    });

    it('should throw error if per-day idempotencyScope requires bucketTimezone', () => {
      expect(() => {
        RewardRule.create(
          1,
          'Test Rule',
          'VISIT',
          { tenantId: 1, programId: 1 },
          {},
          { type: 'fixed', points: 10 },
          { frequency: 'daily' },
          {
            conflictGroup: VISIT_CONFLICT_GROUPS.CG_VISIT_DAILY,
            stackPolicy: STACK_POLICIES.EXCLUSIVE,
            priorityRank: 10,
          },
          {
            strategy: 'per-day',
            // missing bucketTimezone
          },
          BASE_EARNING_DOMAINS.BASE_VISIT,
        );
      }).toThrow('per-day idempotencyScope requires bucketTimezone');
    });

    it('should create rule with rate formula for PURCHASE', () => {
      const rule = RewardRule.create(
        1,
        'Rate Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        {
          type: 'rate',
          rate: 0.1,
          amountField: 'netAmount',
          roundingPolicy: 'floor',
          minPoints: 10,
          maxPoints: 1000,
        },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
      );

      expect(rule.pointsFormula.type).toBe('rate');
      expect((rule.pointsFormula as any).rate).toBe(0.1);
      expect((rule.pointsFormula as any).amountField).toBe('netAmount');
    });

    it('should create rule with table formula for PURCHASE', () => {
      const rule = RewardRule.create(
        1,
        'Table Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        {
          type: 'table',
          table: [
            { min: 0, max: 100, points: 10 },
            { min: 100, max: 500, points: 50 },
            { min: 500, max: null, points: 200 },
          ],
          amountField: 'grossAmount',
        },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
      );

      expect(rule.pointsFormula.type).toBe('table');
      expect((rule.pointsFormula as any).table).toHaveLength(3);
    });

    it('should create rule with hybrid formula', () => {
      const rule = RewardRule.create(
        1,
        'Hybrid Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        {
          type: 'hybrid',
          base: { type: 'fixed', points: 50 },
          bonuses: [
            {
              condition: { minAmount: 200 },
              bonus: { type: 'fixed', points: 25 },
            },
          ],
        },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BONUS_FIXED,
          stackPolicy: STACK_POLICIES.STACK,
          priorityRank: 5,
        },
        { strategy: 'default' },
        BONUS_EARNING_DOMAINS.BONUS_PURCHASE_FIXED,
      );

      expect(rule.pointsFormula.type).toBe('hybrid');
      expect((rule.pointsFormula as any).base.type).toBe('fixed');
    });
  });

  describe('isActive', () => {
    it('should return true for active rule without date restrictions', () => {
      const rule = RewardRule.create(
        1,
        'Active Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
        null,
        'active',
      );

      expect(rule.isActive()).toBe(true);
    });

    it('should return false for inactive rule', () => {
      const rule = RewardRule.create(
        1,
        'Inactive Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
        null,
        'inactive',
      );

      expect(rule.isActive()).toBe(false);
    });

    it('should return false for draft rule', () => {
      const rule = RewardRule.create(
        1,
        'Draft Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
        null,
        'draft',
      );

      expect(rule.isActive()).toBe(false);
    });

    it('should return false if activeFrom is in the future', () => {
      const futureDate = new Date('2099-01-01T00:00:00Z');
      const rule = RewardRule.create(
        1,
        'Future Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
        null,
        'active',
        1,
        futureDate,
      );

      expect(rule.isActive()).toBe(false);
    });

    it('should return false if activeTo is in the past', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      const rule = RewardRule.create(
        1,
        'Expired Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
        null,
        'active',
        1,
        undefined,
        pastDate,
      );

      expect(rule.isActive()).toBe(false);
    });

    it('should return true if rule is within active date range', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      const futureDate = new Date('2099-01-01T00:00:00Z');
      const rule = RewardRule.create(
        1,
        'Active Range Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
        null,
        'active',
        1,
        pastDate,
        futureDate,
      );

      expect(rule.isActive()).toBe(true);
    });
  });

  describe('activate', () => {
    it('should activate a draft rule', () => {
      const rule = RewardRule.create(
        1,
        'Draft Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
        null,
        'draft',
      );

      const activated = rule.activate();

      expect(activated.status).toBe('active');
      expect(activated.id).toBe(rule.id);
      expect(activated.activeFrom).toBeInstanceOf(Date);
    });

    it('should activate with custom activeFrom date', () => {
      const rule = RewardRule.create(
        1,
        'Draft Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
        null,
        'draft',
      );

      const customDate = new Date('2025-06-01T00:00:00Z');
      const activated = rule.activate(customDate);

      expect(activated.status).toBe('active');
      expect(activated.activeFrom).toEqual(customDate);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active rule', () => {
      const rule = RewardRule.create(
        1,
        'Active Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
        null,
        'active',
      );

      const deactivated = rule.deactivate();

      expect(deactivated.status).toBe('inactive');
      expect(deactivated.id).toBe(rule.id);
      expect(deactivated.activeTo).toBeInstanceOf(Date);
    });
  });

  describe('createNewVersion', () => {
    it('should create a new version with updated fields', () => {
      const rule = RewardRule.create(
        1,
        'Original Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
        'Original description',
        'active',
        1, // version
      );

      const newVersion = rule.createNewVersion({
        name: 'Updated Rule',
        description: 'Updated description',
        pointsFormula: { type: 'fixed', points: 150 },
        conflict: {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE as any,
          stackPolicy: STACK_POLICIES.EXCLUSIVE as any,
          priorityRank: 15,
        },
      });

      expect(newVersion.version).toBe(2);
      expect(newVersion.name).toBe('Updated Rule');
      expect(newVersion.description).toBe('Updated description');
      expect(newVersion.pointsFormula).toEqual({ type: 'fixed', points: 150 });
      expect(newVersion.conflict.priorityRank).toBe(15);
      expect(newVersion.id).toBe(rule.id);
      expect(newVersion.programId).toBe(rule.programId);
    });

    it('should keep original fields if not updated', () => {
      const rule = RewardRule.create(
        1,
        'Original Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 100 },
        {},
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
        'Original description',
      );

      const newVersion = rule.createNewVersion({
        name: 'Updated Rule',
      });

      expect(newVersion.description).toBe('Original description');
      expect(newVersion.pointsFormula).toEqual({ type: 'fixed', points: 100 });
      expect(newVersion.conflict.priorityRank).toBe(10);
    });
  });
});
