import { LoyaltyProgram } from '@libs/domain/entities/loyalty/loyalty-program.entity';
import { BASE_EARNING_DOMAINS } from '../../constants/earning-domains';

describe('LoyaltyProgram Entity', () => {
  const baseDate = new Date('2024-01-01T10:00:00Z');
  const futureDate = new Date('2025-12-31T23:59:59Z');

  describe('create', () => {
    it('should create a BASE program with all required fields', () => {
      const program = LoyaltyProgram.create(
        1, // tenantId
        'Base Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10, // priorityRank
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      expect(program.tenantId).toBe(1);
      expect(program.name).toBe('Base Program');
      expect(program.programType).toBe('BASE');
      expect(program.priorityRank).toBe(10);
      expect(program.status).toBe('draft');
      expect(program.version).toBe(1);
      expect(program.createdAt).toBeInstanceOf(Date);
      expect(program.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a PROMO program with optional fields', () => {
      const program = LoyaltyProgram.create(
        1,
        'Promo Program',
        'PROMO',
        [{ domain: 'BONUS_CATEGORY' }],
        5,
        {
          allowed: true,
          maxProgramsPerEvent: 1,
          selectionStrategy: 'BEST_VALUE',
        },
        {
          enabled: true,
          type: 'bucketed',
          daysToExpire: 90,
          gracePeriodDays: 7,
        },
        100, // minPointsToRedeem
        'Promo description',
        { maxPointsPerEvent: 500 },
        'GTQ',
        'active',
        1,
        baseDate,
        futureDate,
        1, // id
      );

      expect(program.id).toBe(1);
      expect(program.description).toBe('Promo description');
      expect(program.minPointsToRedeem).toBe(100);
      expect(program.currency).toBe('GTQ');
      expect(program.status).toBe('active');
      expect(program.activeFrom).toEqual(baseDate);
      expect(program.activeTo).toEqual(futureDate);
      expect(program.limits).toEqual({ maxPointsPerEvent: 500 });
    });

    it('should throw error if priorityRank is negative', () => {
      expect(() => {
        LoyaltyProgram.create(
          1,
          'Test Program',
          'BASE',
          [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
          -1, // negative priorityRank
          { allowed: false },
          { enabled: false, type: 'simple' },
        );
      }).toThrow('Priority rank must be non-negative');
    });

    it('should throw error if minPointsToRedeem is negative', () => {
      expect(() => {
        LoyaltyProgram.create(
          1,
          'Test Program',
          'BASE',
          [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
          10,
          { allowed: false },
          { enabled: false, type: 'simple' },
          -10, // negative minPointsToRedeem
        );
      }).toThrow('minPointsToRedeem must be non-negative');
    });

    it('should throw error if non-BASE program has no earningDomains', () => {
      expect(() => {
        LoyaltyProgram.create(
          1,
          'Promo Program',
          'PROMO',
          [], // empty earningDomains
          5,
          { allowed: true },
          { enabled: false, type: 'simple' },
        );
      }).toThrow('Non-BASE programs must have at least one earning domain');
    });

    it('should allow BASE program with empty earningDomains', () => {
      const program = LoyaltyProgram.create(
        1,
        'Base Program',
        'BASE',
        [], // empty earningDomains allowed for BASE
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      expect(program.earningDomains).toEqual([]);
    });
  });

  describe('isActive', () => {
    it('should return true for active program without date restrictions', () => {
      const program = LoyaltyProgram.create(
        1,
        'Active Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
        undefined,
        undefined,
        undefined,
        undefined,
        'active',
      );

      expect(program.isActive()).toBe(true);
    });

    it('should return false for inactive program', () => {
      const program = LoyaltyProgram.create(
        1,
        'Inactive Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
        undefined,
        undefined,
        undefined,
        undefined,
        'inactive',
      );

      expect(program.isActive()).toBe(false);
    });

    it('should return false for draft program', () => {
      const program = LoyaltyProgram.create(
        1,
        'Draft Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
        undefined,
        undefined,
        undefined,
        undefined,
        'draft',
      );

      expect(program.isActive()).toBe(false);
    });

    it('should return false if activeFrom is in the future', () => {
      const futureDate = new Date('2099-01-01T00:00:00Z');
      const program = LoyaltyProgram.create(
        1,
        'Future Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
        undefined,
        undefined,
        undefined,
        undefined,
        'active',
        1,
        futureDate,
      );

      expect(program.isActive()).toBe(false);
    });

    it('should return false if activeTo is in the past', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      const program = LoyaltyProgram.create(
        1,
        'Expired Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
        undefined,
        undefined,
        undefined,
        undefined,
        'active',
        1,
        undefined,
        pastDate,
      );

      expect(program.isActive()).toBe(false);
    });

    it('should return true if program is within active date range', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      const futureDate = new Date('2099-01-01T00:00:00Z');
      const program = LoyaltyProgram.create(
        1,
        'Active Range Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
        undefined,
        undefined,
        undefined,
        undefined,
        'active',
        1,
        pastDate,
        futureDate,
      );

      expect(program.isActive()).toBe(true);
    });
  });

  describe('canCoexistWith', () => {
    it('should return false for two BASE programs', () => {
      const program1 = LoyaltyProgram.create(
        1,
        'Base 1',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      const program2 = LoyaltyProgram.create(
        1,
        'Base 2',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        5,
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      expect(program1.canCoexistWith(program2)).toBe(false);
    });

    it('should return true for BASE and PROMO programs', () => {
      const baseProgram = LoyaltyProgram.create(
        1,
        'Base',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      const promoProgram = LoyaltyProgram.create(
        1,
        'Promo',
        'PROMO',
        [{ domain: 'BONUS_CATEGORY' }],
        5,
        { allowed: true },
        { enabled: false, type: 'simple' },
      );

      expect(baseProgram.canCoexistWith(promoProgram)).toBe(true);
    });

    it('should return false if both programs have BASE_PURCHASE and stacking not allowed', () => {
      const program1 = LoyaltyProgram.create(
        1,
        'Program 1',
        'PROMO',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      const program2 = LoyaltyProgram.create(
        1,
        'Program 2',
        'PROMO',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        5,
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      expect(program1.canCoexistWith(program2)).toBe(false);
    });

    it('should return true if both programs have BASE_PURCHASE and stacking allowed', () => {
      const program1 = LoyaltyProgram.create(
        1,
        'Program 1',
        'PROMO',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: true },
        { enabled: false, type: 'simple' },
      );

      const program2 = LoyaltyProgram.create(
        1,
        'Program 2',
        'PROMO',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        5,
        { allowed: true },
        { enabled: false, type: 'simple' },
      );

      expect(program1.canCoexistWith(program2)).toBe(true);
    });
  });

  describe('getEarningDomains', () => {
    it('should return array of domain strings', () => {
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }, { domain: 'BONUS_CATEGORY' }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      const domains = program.getEarningDomains();
      expect(domains).toEqual([BASE_EARNING_DOMAINS.BASE_PURCHASE, 'BONUS_CATEGORY']);
    });

    it('should return empty array for program with no earningDomains', () => {
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      expect(program.getEarningDomains()).toEqual([]);
    });
  });

  describe('hasEarningDomain', () => {
    it('should return true if program has the domain', () => {
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      expect(program.hasEarningDomain(BASE_EARNING_DOMAINS.BASE_PURCHASE)).toBe(true);
    });

    it('should return false if program does not have the domain', () => {
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      expect(program.hasEarningDomain('BONUS_CATEGORY')).toBe(false);
    });
  });

  describe('activate', () => {
    it('should activate a draft program', () => {
      const program = LoyaltyProgram.create(
        1,
        'Draft Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
        undefined,
        undefined,
        undefined,
        undefined,
        'draft',
      );

      const activated = program.activate();

      expect(activated.status).toBe('active');
      expect(activated.id).toBe(program.id);
      expect(activated.activeFrom).toBeInstanceOf(Date);
    });

    it('should activate with custom activeFrom date', () => {
      const program = LoyaltyProgram.create(
        1,
        'Draft Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
        undefined,
        undefined,
        undefined,
        undefined,
        'draft',
      );

      const customDate = new Date('2025-06-01T00:00:00Z');
      const activated = program.activate(customDate);

      expect(activated.status).toBe('active');
      expect(activated.activeFrom).toEqual(customDate);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active program', () => {
      const program = LoyaltyProgram.create(
        1,
        'Active Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
        undefined,
        undefined,
        undefined,
        undefined,
        'active',
      );

      const deactivated = program.deactivate();

      expect(deactivated.status).toBe('inactive');
      expect(deactivated.id).toBe(program.id);
      expect(deactivated.activeTo).toBeInstanceOf(Date);
    });
  });

  describe('createNewVersion', () => {
    it('should create a new version with updated fields', () => {
      const program = LoyaltyProgram.create(
        1,
        'Original Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
        undefined,
        'Original description',
        undefined,
        undefined,
        'active',
        1, // version
      );

      const newVersion = program.createNewVersion({
        name: 'Updated Program',
        description: 'Updated description',
        priorityRank: 15,
      });

      expect(newVersion.version).toBe(2);
      expect(newVersion.name).toBe('Updated Program');
      expect(newVersion.description).toBe('Updated description');
      expect(newVersion.priorityRank).toBe(15);
      expect(newVersion.id).toBe(program.id);
      expect(newVersion.tenantId).toBe(program.tenantId);
    });

    it('should keep original fields if not updated', () => {
      const program = LoyaltyProgram.create(
        1,
        'Original Program',
        'BASE',
        [{ domain: BASE_EARNING_DOMAINS.BASE_PURCHASE }],
        10,
        { allowed: false },
        { enabled: false, type: 'simple' },
        undefined,
        'Original description',
      );

      const newVersion = program.createNewVersion({
        name: 'Updated Program',
      });

      expect(newVersion.description).toBe('Original description');
      expect(newVersion.priorityRank).toBe(10);
    });
  });
});
