import { RewardRuleMapper } from '../reward-rule.mapper';
import { RewardRuleEntity } from '../../entities/reward-rule.entity';
import { RewardRuleEligibilityEntity } from '../../entities/reward-rule-eligibility.entity';
import { RewardRulePointsFormulaEntity } from '../../entities/reward-rule-points-formula.entity';
import { RewardRuleEligibilityMembershipStatusEntity } from '../../entities/reward-rule-eligibility-membership-status.entity';
import { RewardRuleEligibilityFlagEntity } from '../../entities/reward-rule-eligibility-flag.entity';
import { RewardRuleEligibilityCategoryIdEntity } from '../../entities/reward-rule-eligibility-category-id.entity';
import { RewardRuleEligibilitySkuEntity } from '../../entities/reward-rule-eligibility-sku.entity';
import { RewardRulePointsTableEntryEntity } from '../../entities/reward-rule-points-table-entry.entity';
import { RewardRule } from '@libs/domain';
import {
  BASE_EARNING_DOMAINS,
  PURCHASE_CONFLICT_GROUPS,
  STACK_POLICIES,
} from '@libs/domain';

describe('RewardRuleMapper', () => {
  const baseDate = new Date('2024-01-01T10:00:00Z');

  describe('toDomain', () => {
    it('should convert entity with relational columns to domain entity', () => {
      const entity = new RewardRuleEntity();
      entity.id = 1;
      entity.programId = 100;
      entity.name = 'Test Rule';
      entity.description = 'Test Description';
      entity.trigger = 'PURCHASE';
      entity.status = 'active';
      entity.version = 1;
      entity.earningDomain = BASE_EARNING_DOMAINS.BASE_PURCHASE;
      entity.conflictGroup = PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE;
      entity.activeFrom = null;
      entity.activeTo = null;
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      // Columnas relacionales de scope
      entity.scopeTenantId = 1;
      entity.scopeProgramId = 100;
      entity.scopeStoreId = 5;
      entity.scopeBranchId = null;
      entity.scopeChannel = 'online';
      entity.scopeCategoryId = 10;
      entity.scopeSku = null;

      // Columnas relacionales de conflict
      entity.conflictStackPolicy = STACK_POLICIES.EXCLUSIVE;
      entity.conflictPriorityRank = 10;
      entity.conflictMaxAwardsPerEvent = 5;

      // Columnas relacionales de idempotencyScope
      entity.idempotencyStrategy = 'per-day';
      entity.idempotencyBucketTimezone = 'America/Guatemala';
      entity.idempotencyPeriodDays = null;

      // Columnas relacionales de limits
      entity.limitFrequency = 'daily';
      entity.limitCooldownHours = 24;
      entity.limitPerEventCap = 100;
      entity.limitPerPeriodCap = 500;
      entity.limitPeriodType = 'rolling';
      entity.limitPeriodDays = 30;

      // Sin relaciones cargadas (debe usar valores por defecto)
      entity.eligibilityRelation = null;
      entity.pointsFormulaRelation = null;

      const domain = RewardRuleMapper.toDomain(entity);

      expect(domain.id).toBe(1);
      expect(domain.programId).toBe(100);
      expect(domain.name).toBe('Test Rule');
      expect(domain.scope.tenantId).toBe(1);
      expect(domain.scope.programId).toBe(100);
      expect(domain.scope.storeId).toBe(5);
      expect(domain.scope.channel).toBe('online');
      expect(domain.scope.categoryId).toBe(10);
      expect(domain.conflict.stackPolicy).toBe(STACK_POLICIES.EXCLUSIVE);
      expect(domain.conflict.priorityRank).toBe(10);
      expect(domain.conflict.maxAwardsPerEvent).toBe(5);
      expect(domain.idempotencyScope.strategy).toBe('per-day');
      expect(domain.idempotencyScope.bucketTimezone).toBe('America/Guatemala');
      expect(domain.limits?.frequency).toBe('daily');
      expect(domain.limits?.cooldownHours).toBe(24);
    });

    it('should convert entity with eligibility relation to domain entity', () => {
      const entity = new RewardRuleEntity();
      entity.id = 1;
      entity.programId = 100;
      entity.name = 'Test Rule';
      entity.description = null;
      entity.trigger = 'PURCHASE';
      entity.status = 'active';
      entity.version = 1;
      entity.earningDomain = BASE_EARNING_DOMAINS.BASE_PURCHASE;
      entity.conflictGroup = PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE;
      entity.activeFrom = null;
      entity.activeTo = null;
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      // Columnas relacionales básicas
      entity.scopeTenantId = 1;
      entity.scopeProgramId = 100;
      entity.conflictStackPolicy = STACK_POLICIES.EXCLUSIVE;
      entity.conflictPriorityRank = 10;
      entity.idempotencyStrategy = 'default';

      // Crear relación de eligibility
      const eligibilityEntity = new RewardRuleEligibilityEntity();
      eligibilityEntity.id = 1;
      eligibilityEntity.rewardRuleId = 1;
      eligibilityEntity.minTierId = 1;
      eligibilityEntity.maxTierId = 3;
      eligibilityEntity.minMembershipAgeDays = 30;
      eligibilityEntity.minAmount = 50.0;
      eligibilityEntity.maxAmount = 1000.0;
      eligibilityEntity.minItems = 2;
      eligibilityEntity.dayOfWeek = [1, 2, 3]; // Lunes, Martes, Miércoles
      eligibilityEntity.timeRangeStart = new Date('1970-01-01T09:00:00Z');
      eligibilityEntity.timeRangeEnd = new Date('1970-01-01T18:00:00Z');
      eligibilityEntity.metadata = JSON.stringify({ custom: 'value' });

      // Crear arrays de eligibility
      const membershipStatus1 = new RewardRuleEligibilityMembershipStatusEntity();
      membershipStatus1.id = 1;
      membershipStatus1.eligibilityId = 1;
      membershipStatus1.status = 'active';
      eligibilityEntity.membershipStatuses = [membershipStatus1];

      const flag1 = new RewardRuleEligibilityFlagEntity();
      flag1.id = 1;
      flag1.eligibilityId = 1;
      flag1.flag = 'VIP';
      eligibilityEntity.flags = [flag1];

      const categoryId1 = new RewardRuleEligibilityCategoryIdEntity();
      categoryId1.id = 1;
      categoryId1.eligibilityId = 1;
      categoryId1.categoryId = 10;
      eligibilityEntity.categoryIds = [categoryId1];

      const sku1 = new RewardRuleEligibilitySkuEntity();
      sku1.id = 1;
      sku1.eligibilityId = 1;
      sku1.sku = 'SKU-123';
      eligibilityEntity.skus = [sku1];

      entity.eligibilityRelation = eligibilityEntity;
      entity.pointsFormulaRelation = null;

      const domain = RewardRuleMapper.toDomain(entity);

      expect(domain.eligibility.minTierId).toBe(1);
      expect(domain.eligibility.maxTierId).toBe(3);
      expect(domain.eligibility.minMembershipAgeDays).toBe(30);
      expect(domain.eligibility.minAmount).toBe(50.0);
      expect(domain.eligibility.maxAmount).toBe(1000.0);
      expect(domain.eligibility.minItems).toBe(2);
      expect(domain.eligibility.dayOfWeek).toEqual([1, 2, 3]);
      expect(domain.eligibility.timeRange?.start).toBe('09:00');
      expect(domain.eligibility.timeRange?.end).toBe('18:00');
      expect(domain.eligibility.membershipStatus).toEqual(['active']);
      expect(domain.eligibility.flags).toEqual(['VIP']);
      expect(domain.eligibility.categoryIds).toEqual([10]);
      expect(domain.eligibility.skus).toEqual(['SKU-123']);
      expect(domain.eligibility.metadata).toEqual({ custom: 'value' });
    });

    it('should convert entity with pointsFormula relation (fixed) to domain entity', () => {
      const entity = new RewardRuleEntity();
      entity.id = 1;
      entity.programId = 100;
      entity.name = 'Test Rule';
      entity.description = null;
      entity.trigger = 'PURCHASE';
      entity.status = 'active';
      entity.version = 1;
      entity.earningDomain = BASE_EARNING_DOMAINS.BASE_PURCHASE;
      entity.conflictGroup = PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE;
      entity.activeFrom = null;
      entity.activeTo = null;
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      entity.scopeTenantId = 1;
      entity.scopeProgramId = 100;
      entity.conflictStackPolicy = STACK_POLICIES.EXCLUSIVE;
      entity.conflictPriorityRank = 10;
      entity.idempotencyStrategy = 'default';
      entity.eligibilityRelation = null;

      // Crear relación de pointsFormula (tipo fixed)
      const formulaEntity = new RewardRulePointsFormulaEntity();
      formulaEntity.id = 1;
      formulaEntity.rewardRuleId = 1;
      formulaEntity.formulaType = 'fixed';
      formulaEntity.fixedPoints = 100;
      formulaEntity.rateRate = null;
      formulaEntity.rateAmountField = null;
      formulaEntity.rateRoundingPolicy = null;
      formulaEntity.rateMinPoints = null;
      formulaEntity.rateMaxPoints = null;
      formulaEntity.tableEntries = [];
      formulaEntity.bonuses = [];

      entity.pointsFormulaRelation = formulaEntity;

      const domain = RewardRuleMapper.toDomain(entity);

      expect(domain.pointsFormula.type).toBe('fixed');
      expect((domain.pointsFormula as any).points).toBe(100);
    });

    it('should convert entity with pointsFormula relation (rate) to domain entity', () => {
      const entity = new RewardRuleEntity();
      entity.id = 1;
      entity.programId = 100;
      entity.name = 'Test Rule';
      entity.description = null;
      entity.trigger = 'PURCHASE';
      entity.status = 'active';
      entity.version = 1;
      entity.earningDomain = BASE_EARNING_DOMAINS.BASE_PURCHASE;
      entity.conflictGroup = PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE;
      entity.activeFrom = null;
      entity.activeTo = null;
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      entity.scopeTenantId = 1;
      entity.scopeProgramId = 100;
      entity.conflictStackPolicy = STACK_POLICIES.EXCLUSIVE;
      entity.conflictPriorityRank = 10;
      entity.idempotencyStrategy = 'default';
      entity.eligibilityRelation = null;

      // Crear relación de pointsFormula (tipo rate)
      const formulaEntity = new RewardRulePointsFormulaEntity();
      formulaEntity.id = 1;
      formulaEntity.rewardRuleId = 1;
      formulaEntity.formulaType = 'rate';
      formulaEntity.fixedPoints = null;
      formulaEntity.rateRate = 0.1; // 1 punto por cada $10
      formulaEntity.rateAmountField = 'netAmount';
      formulaEntity.rateRoundingPolicy = 'floor';
      formulaEntity.rateMinPoints = 1;
      formulaEntity.rateMaxPoints = 1000;
      formulaEntity.tableEntries = [];
      formulaEntity.bonuses = [];

      entity.pointsFormulaRelation = formulaEntity;

      const domain = RewardRuleMapper.toDomain(entity);

      expect(domain.pointsFormula.type).toBe('rate');
      expect((domain.pointsFormula as any).rate).toBe(0.1);
      expect((domain.pointsFormula as any).amountField).toBe('netAmount');
      expect((domain.pointsFormula as any).roundingPolicy).toBe('floor');
      expect((domain.pointsFormula as any).minPoints).toBe(1);
      expect((domain.pointsFormula as any).maxPoints).toBe(1000);
    });

    it('should convert entity with pointsFormula relation (table) to domain entity', () => {
      const entity = new RewardRuleEntity();
      entity.id = 1;
      entity.programId = 100;
      entity.name = 'Test Rule';
      entity.description = null;
      entity.trigger = 'PURCHASE';
      entity.status = 'active';
      entity.version = 1;
      entity.earningDomain = BASE_EARNING_DOMAINS.BASE_PURCHASE;
      entity.conflictGroup = PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE;
      entity.activeFrom = null;
      entity.activeTo = null;
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      entity.scopeTenantId = 1;
      entity.scopeProgramId = 100;
      entity.conflictStackPolicy = STACK_POLICIES.EXCLUSIVE;
      entity.conflictPriorityRank = 10;
      entity.idempotencyStrategy = 'default';
      entity.eligibilityRelation = null;

      // Crear relación de pointsFormula (tipo table)
      const formulaEntity = new RewardRulePointsFormulaEntity();
      formulaEntity.id = 1;
      formulaEntity.rewardRuleId = 1;
      formulaEntity.formulaType = 'table';
      formulaEntity.fixedPoints = null;
      formulaEntity.rateRate = null;
      formulaEntity.rateAmountField = 'netAmount';
      formulaEntity.rateRoundingPolicy = null;
      formulaEntity.rateMinPoints = null;
      formulaEntity.rateMaxPoints = null;

      const entry1 = new RewardRulePointsTableEntryEntity();
      entry1.id = 1;
      entry1.formulaId = 1;
      entry1.minValue = 0;
      entry1.maxValue = 100;
      entry1.points = 10;
      entry1.sortOrder = 0;

      const entry2 = new RewardRulePointsTableEntryEntity();
      entry2.id = 2;
      entry2.formulaId = 1;
      entry2.minValue = 100;
      entry2.maxValue = null;
      entry2.points = 20;
      entry2.sortOrder = 1;

      formulaEntity.tableEntries = [entry1, entry2];
      formulaEntity.bonuses = [];

      entity.pointsFormulaRelation = formulaEntity;

      const domain = RewardRuleMapper.toDomain(entity);

      expect(domain.pointsFormula.type).toBe('table');
      expect((domain.pointsFormula as any).amountField).toBe('netAmount');
      expect((domain.pointsFormula as any).table).toHaveLength(2);
      expect((domain.pointsFormula as any).table[0]).toEqual({
        min: 0,
        max: 100,
        points: 10,
      });
      expect((domain.pointsFormula as any).table[1]).toEqual({
        min: 100,
        max: null,
        points: 20,
      });
    });

    it('should use default values when relations are not loaded', () => {
      const entity = new RewardRuleEntity();
      entity.id = 1;
      entity.programId = 100;
      entity.name = 'Test Rule';
      entity.description = null;
      entity.trigger = 'PURCHASE';
      entity.status = 'active';
      entity.version = 1;
      entity.earningDomain = BASE_EARNING_DOMAINS.BASE_PURCHASE;
      entity.conflictGroup = PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE;
      entity.activeFrom = null;
      entity.activeTo = null;
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      // Columnas relacionales básicas
      entity.scopeTenantId = 1;
      entity.scopeProgramId = 100;
      entity.conflictStackPolicy = STACK_POLICIES.EXCLUSIVE;
      entity.conflictPriorityRank = 10;
      entity.idempotencyStrategy = 'default';

      // Sin relaciones cargadas (debe usar valores por defecto)
      entity.eligibilityRelation = null;
      entity.pointsFormulaRelation = null;

      const domain = RewardRuleMapper.toDomain(entity);

      expect(domain.eligibility.minTierId).toBeNull();
      expect(domain.eligibility.membershipStatus).toBeNull();
      expect(domain.pointsFormula.type).toBe('fixed');
      expect((domain.pointsFormula as any).points).toBe(0);
    });
  });

  describe('toPersistence', () => {
    it('should convert domain entity to persistence entity with relational columns', () => {
      const domain = RewardRule.create(
        100,
        'Test Rule',
        'PURCHASE',
        {
          tenantId: 1,
          programId: 100,
          storeId: 5,
          branchId: null,
          channel: 'online',
          categoryId: 10,
          sku: null,
        },
        {
          minTierId: 1,
          membershipStatus: ['active'],
        },
        { type: 'fixed', points: 100 },
        {
          frequency: 'daily',
          cooldownHours: 24,
          perEventCap: 100,
        },
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
          maxAwardsPerEvent: 5,
        },
        {
          strategy: 'per-day',
          bucketTimezone: 'America/Guatemala',
        },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
      );

      const persistence = RewardRuleMapper.toPersistence(domain);

      expect(persistence.programId).toBe(100);
      expect(persistence.name).toBe('Test Rule');
      expect(persistence.scopeTenantId).toBe(1);
      expect(persistence.scopeProgramId).toBe(100);
      expect(persistence.scopeStoreId).toBe(5);
      expect(persistence.scopeChannel).toBe('online');
      expect(persistence.scopeCategoryId).toBe(10);
      expect(persistence.conflictStackPolicy).toBe(STACK_POLICIES.EXCLUSIVE);
      expect(persistence.conflictPriorityRank).toBe(10);
      expect(persistence.conflictMaxAwardsPerEvent).toBe(5);
      expect(persistence.idempotencyStrategy).toBe('per-day');
      expect(persistence.idempotencyBucketTimezone).toBe('America/Guatemala');
      expect(persistence.limitFrequency).toBe('daily');
      expect(persistence.limitCooldownHours).toBe(24);
      expect(persistence.limitPerEventCap).toBe(100);
    });

    it('should handle null limits correctly', () => {
      const domain = RewardRule.create(
        100,
        'Test Rule',
        'PURCHASE',
        { tenantId: 1, programId: 100 },
        {},
        { type: 'fixed', points: 100 },
        null, // limits es null
        {
          conflictGroup: PURCHASE_CONFLICT_GROUPS.CG_PURCHASE_BASE,
          stackPolicy: STACK_POLICIES.EXCLUSIVE,
          priorityRank: 10,
        },
        { strategy: 'default' },
        BASE_EARNING_DOMAINS.BASE_PURCHASE,
      );

      const persistence = RewardRuleMapper.toPersistence(domain);

      expect(persistence.limitFrequency).toBeNull();
      expect(persistence.limitCooldownHours).toBeNull();
      expect(persistence.limitPerEventCap).toBeNull();
    });
  });
});
