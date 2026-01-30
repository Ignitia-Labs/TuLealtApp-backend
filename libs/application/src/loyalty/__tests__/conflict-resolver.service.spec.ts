import { Test, TestingModule } from '@nestjs/testing';
import { ConflictResolver } from '../conflict-resolver.service';
import {
  RuleEvaluationResult,
  IPointsTransactionRepository,
  IRewardRuleRepository,
} from '@libs/domain';

describe('ConflictResolver', () => {
  let service: ConflictResolver;
  let mockPointsTransactionRepository: jest.Mocked<IPointsTransactionRepository>;
  let mockRuleRepository: jest.Mocked<IRewardRuleRepository>;

  beforeEach(async () => {
    // Crear mocks
    mockPointsTransactionRepository = {
      findEarningsByMembershipAndPeriod: jest.fn().mockResolvedValue([]),
    } as any;

    mockRuleRepository = {
      findById: jest.fn().mockResolvedValue(null),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConflictResolver,
        {
          provide: 'IPointsTransactionRepository',
          useValue: mockPointsTransactionRepository,
        },
        {
          provide: 'IRewardRuleRepository',
          useValue: mockRuleRepository,
        },
      ],
    }).compile();

    service = module.get<ConflictResolver>(ConflictResolver);
  });

  describe('resolveConflicts', () => {
    const eventDate = new Date('2025-01-28T10:00:00Z');
    const membershipId = 1;

    it('should return empty array for empty evaluations', async () => {
      const result = await service.resolveConflicts([], eventDate, membershipId);
      expect(result).toEqual([]);
    });

    it('should apply STACK policy - return all evaluations', async () => {
      const evaluations: RuleEvaluationResult[] = [
        {
          ruleId: 1,
          programId: 1,
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'STACK',
          priorityRank: 10,
          points: 100,
          earningDomain: 'BASE_PURCHASE',
          idempotencyKey: 'key1',
        },
        {
          ruleId: 2,
          programId: 1,
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'STACK',
          priorityRank: 5,
          points: 50,
          earningDomain: 'BASE_PURCHASE',
          idempotencyKey: 'key2',
        },
      ];

      // Mock reglas sin límites
      mockRuleRepository.findById.mockImplementation((id) => {
        return Promise.resolve({
          id,
          limits: null,
        } as any);
      });

      const result = await service.resolveConflicts(evaluations, eventDate, membershipId);
      expect(result).toHaveLength(2);
    });

    it('should apply EXCLUSIVE policy - return only best by priority', async () => {
      const evaluations: RuleEvaluationResult[] = [
        {
          ruleId: 1,
          programId: 1,
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 10,
          points: 100,
          earningDomain: 'BASE_PURCHASE',
          idempotencyKey: 'key1',
        },
        {
          ruleId: 2,
          programId: 1,
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 5,
          points: 150, // Más puntos pero menor prioridad
          earningDomain: 'BASE_PURCHASE',
          idempotencyKey: 'key2',
        },
      ];

      const result = await service.resolveConflicts(evaluations, eventDate, membershipId);
      expect(result).toHaveLength(1);
      expect(result[0].ruleId).toBe(1); // Mayor priorityRank
    });

    it('should apply BEST_OF policy - return evaluation with most points', async () => {
      const evaluations: RuleEvaluationResult[] = [
        {
          ruleId: 1,
          programId: 1,
          conflictGroup: 'CG_PURCHASE_BONUS',
          stackPolicy: 'BEST_OF',
          priorityRank: 10,
          points: 100,
          earningDomain: 'BONUS_CATEGORY',
          idempotencyKey: 'key1',
        },
        {
          ruleId: 2,
          programId: 1,
          conflictGroup: 'CG_PURCHASE_BONUS',
          stackPolicy: 'BEST_OF',
          priorityRank: 5,
          points: 200, // Más puntos
          earningDomain: 'BONUS_CATEGORY',
          idempotencyKey: 'key2',
        },
      ];

      const result = await service.resolveConflicts(evaluations, eventDate, membershipId);
      expect(result).toHaveLength(1);
      expect(result[0].ruleId).toBe(2); // Más puntos
    });

    it('should apply PRIORITY policy - return evaluation with highest priorityRank', async () => {
      const evaluations: RuleEvaluationResult[] = [
        {
          ruleId: 1,
          programId: 1,
          conflictGroup: 'CG_PURCHASE_PROMO',
          stackPolicy: 'PRIORITY',
          priorityRank: 15,
          points: 50,
          earningDomain: 'BONUS_PURCHASE_FIXED',
          idempotencyKey: 'key1',
        },
        {
          ruleId: 2,
          programId: 1,
          conflictGroup: 'CG_PURCHASE_PROMO',
          stackPolicy: 'PRIORITY',
          priorityRank: 20, // Mayor priorityRank
          points: 30,
          earningDomain: 'BONUS_PURCHASE_FIXED',
          idempotencyKey: 'key2',
        },
      ];

      const result = await service.resolveConflicts(evaluations, eventDate, membershipId);
      expect(result).toHaveLength(1);
      expect(result[0].ruleId).toBe(2);
    });

    it('should resolve conflicts per conflictGroup', async () => {
      const evaluations: RuleEvaluationResult[] = [
        {
          ruleId: 1,
          programId: 1,
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 10,
          points: 100,
          earningDomain: 'BASE_PURCHASE',
          idempotencyKey: 'key1',
        },
        {
          ruleId: 2,
          programId: 1,
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 5,
          points: 50,
          earningDomain: 'BASE_PURCHASE',
          idempotencyKey: 'key2',
        },
        {
          ruleId: 3,
          programId: 1,
          conflictGroup: 'CG_PURCHASE_BONUS',
          stackPolicy: 'STACK',
          priorityRank: 8,
          points: 25,
          earningDomain: 'BONUS_CATEGORY',
          idempotencyKey: 'key3',
        },
      ];

      // Mock reglas sin límites para STACK
      mockRuleRepository.findById.mockImplementation((id) => {
        return Promise.resolve({
          id,
          limits: null,
        } as any);
      });

      const result = await service.resolveConflicts(evaluations, eventDate, membershipId);
      // CG_PURCHASE_BASE: EXCLUSIVE -> 1 resultado (ruleId 1)
      // CG_PURCHASE_BONUS: STACK -> 1 resultado (ruleId 3)
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.ruleId).sort()).toEqual([1, 3]);
    });
  });
});
