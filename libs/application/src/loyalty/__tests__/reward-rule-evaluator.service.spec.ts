import { Test, TestingModule } from '@nestjs/testing';
import { RewardRuleEvaluator } from '../reward-rule-evaluator.service';
import {
  IRewardRuleRepository,
  RewardRule,
  CustomerMembership,
  CustomerTier,
  LoyaltyEvent,
} from '@libs/domain';

describe('RewardRuleEvaluator', () => {
  let service: RewardRuleEvaluator;
  let ruleRepository: jest.Mocked<IRewardRuleRepository>;

  beforeEach(async () => {
    const mockRuleRepository = {
      findActiveByProgramIdAndTrigger: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardRuleEvaluator,
        {
          provide: 'IRewardRuleRepository',
          useValue: mockRuleRepository,
        },
      ],
    }).compile();

    service = module.get<RewardRuleEvaluator>(RewardRuleEvaluator);
    ruleRepository = module.get('IRewardRuleRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateRules', () => {
    const mockMembership = CustomerMembership.create(
      10,
      1,
      null,
      100,
      null,
      0,
      0,
      null,
      new Date('2024-01-01'),
      'QR-123',
      'active',
      100,
    );

    const mockTier = CustomerTier.create(
      1, // tenantId
      'Gold', // name
      0, // minPoints
      '#FFD700', // color
      [], // benefits
      1, // priority
      null, // description
      null, // maxPoints
      1.25, // multiplier
      null, // icon
      'active', // status
      1, // id (opcional)
    );

    const purchaseEvent: LoyaltyEvent = {
      tenantId: 1,
      eventType: 'PURCHASE',
      sourceEventId: 'ORDER-123',
      occurredAt: new Date('2025-01-28T10:00:00Z'),
      membershipRef: { membershipId: 100 },
      payload: {
        orderId: 'ORDER-123',
        netAmount: 100.0,
        grossAmount: 120.0,
        currency: 'GTQ',
        items: [
          {
            sku: 'SKU-001',
            qty: 2,
            unitPrice: 50.0,
            categoryId: 5,
          },
        ],
      },
    };

    it('should return empty array if no rules found', async () => {
      ruleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([]);

      const result = await service.evaluateRules(1, purchaseEvent, mockMembership, null);

      expect(result).toEqual([]);
    });

    it('should evaluate fixed points formula', async () => {
      const rule = RewardRule.create(
        1,
        'Fixed Points Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'fixed', points: 50 },
        {},
        {
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 10,
        },
        { strategy: 'default' },
        'BASE_PURCHASE',
      );

      ruleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([rule]);

      const result = await service.evaluateRules(1, purchaseEvent, mockMembership, null);

      expect(result).toHaveLength(1);
      expect(result[0].points).toBe(50);
      expect(result[0].ruleId).toBe(rule.id);
    });

    it('should evaluate rate points formula', async () => {
      const rule = RewardRule.create(
        1,
        'Rate Points Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        {
          type: 'rate',
          rate: 0.1, // 1 punto por cada $10
          amountField: 'netAmount',
          roundingPolicy: 'floor',
        },
        {},
        {
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 10,
        },
        { strategy: 'default' },
        'BASE_PURCHASE',
      );

      ruleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([rule]);

      const result = await service.evaluateRules(1, purchaseEvent, mockMembership, null);

      expect(result).toHaveLength(1);
      // 100 * 0.1 = 10 puntos
      expect(result[0].points).toBe(10);
    });

    it('should apply tier multiplier', async () => {
      const rule = RewardRule.create(
        1,
        'Fixed Points Rule',
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

      ruleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([rule]);

      const result = await service.evaluateRules(1, purchaseEvent, mockMembership, mockTier);

      expect(result).toHaveLength(1);
      // 100 * 1.25 = 125 puntos
      expect(result[0].points).toBe(125);
    });

    it('should filter rules by eligibility - minAmount', async () => {
      const rule = RewardRule.create(
        1,
        'Min Amount Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {
          minAmount: 200, // Requiere mínimo $200
        },
        { type: 'fixed', points: 50 },
        {},
        {
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 10,
        },
        { strategy: 'default' },
        'BASE_PURCHASE',
      );

      ruleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([rule]);

      const result = await service.evaluateRules(1, purchaseEvent, mockMembership, null);

      // La compra es de $100, no cumple el mínimo de $200
      expect(result).toHaveLength(0);
    });

    it('should filter rules by eligibility - membershipStatus', async () => {
      const inactiveMembership = CustomerMembership.create(
        10,
        1,
        null,
        100,
        null,
        0,
        0,
        null,
        new Date('2024-01-01'),
        'QR-123',
        'inactive',
        100,
      );

      const rule = RewardRule.create(
        1,
        'Active Only Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {
          membershipStatus: ['active'],
        },
        { type: 'fixed', points: 50 },
        {},
        {
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 10,
        },
        { strategy: 'default' },
        'BASE_PURCHASE',
      );

      ruleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([rule]);

      const result = await service.evaluateRules(1, purchaseEvent, inactiveMembership, null);

      expect(result).toHaveLength(0);
    });

    it('should return empty array if no eligible rules', async () => {
      const rule = RewardRule.create(
        1,
        'Ineligible Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {
          minAmount: 500, // Requiere mínimo $500
        },
        { type: 'fixed', points: 50 },
        {},
        {
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 10,
        },
        { strategy: 'default' },
        'BASE_PURCHASE',
      );

      ruleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([rule]);

      const result = await service.evaluateRules(1, purchaseEvent, mockMembership, null);

      expect(result).toHaveLength(0);
    });
  });
});
