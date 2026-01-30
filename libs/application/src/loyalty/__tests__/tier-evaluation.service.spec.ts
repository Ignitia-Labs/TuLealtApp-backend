import { Test, TestingModule } from '@nestjs/testing';
import { TierEvaluationService } from '../tier-evaluation.service';
import {
  TierPolicy,
  CustomerTier,
  PointsTransaction,
  IPointsTransactionRepository,
  ICustomerTierRepository,
  ITierPolicyRepository,
  ITierStatusRepository,
} from '@libs/domain';

describe('TierEvaluationService', () => {
  let service: TierEvaluationService;
  let pointsTransactionRepository: jest.Mocked<IPointsTransactionRepository>;
  let tierRepository: jest.Mocked<ICustomerTierRepository>;
  let policyRepository: jest.Mocked<ITierPolicyRepository>;
  let statusRepository: jest.Mocked<ITierStatusRepository>;

  beforeEach(async () => {
    pointsTransactionRepository = {
      findForTierEvaluation: jest.fn(),
    } as any;

    tierRepository = {
      findByTenantId: jest.fn(),
    } as any;

    policyRepository = {
      findActiveByTenantId: jest.fn(),
    } as any;

    statusRepository = {
      findByMembershipId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TierEvaluationService,
        {
          provide: 'IPointsTransactionRepository',
          useValue: pointsTransactionRepository,
        },
        {
          provide: 'ICustomerTierRepository',
          useValue: tierRepository,
        },
        {
          provide: 'ITierPolicyRepository',
          useValue: policyRepository,
        },
        {
          provide: 'ITierStatusRepository',
          useValue: statusRepository,
        },
      ],
    }).compile();

    service = module.get<TierEvaluationService>(TierEvaluationService);
  });

  describe('evaluateTier', () => {
    it('should evaluate tier correctly for membership', async () => {
      const membershipId = 1;
      const tenantId = 1;

      const policy = TierPolicy.create(
        tenantId,
        'MONTHLY',
        'FIXED',
        { 1: 0, 2: 100, 3: 500 },
        30,
        0,
        'GRACE_PERIOD',
      );

      const tiers = [
        CustomerTier.create(
          tenantId,
          'Bronze',
          0,
          '#cd7f32',
          [],
          1,
          null,
          99,
          null,
          null,
          'active',
          1,
        ),
        CustomerTier.create(
          tenantId,
          'Silver',
          100,
          '#c0c0c0',
          [],
          2,
          null,
          499,
          null,
          null,
          'active',
          2,
        ),
        CustomerTier.create(
          tenantId,
          'Gold',
          500,
          '#ffd700',
          [],
          3,
          null,
          null,
          null,
          null,
          'active',
          3,
        ),
      ];

      const transactions = [
        PointsTransaction.createEarning(
          tenantId,
          1,
          membershipId,
          150,
          'key-1',
          'event-1',
          null,
          'SYSTEM',
          'EARNING',
          1,
          1,
          null,
          null,
        ),
      ];

      policyRepository.findActiveByTenantId.mockResolvedValue(policy);
      statusRepository.findByMembershipId.mockResolvedValue(null);
      tierRepository.findByTenantId.mockResolvedValue(tiers);
      pointsTransactionRepository.findForTierEvaluation.mockResolvedValue(transactions);

      const result = await service.evaluateTier(membershipId, tenantId);

      expect(result.currentTierId).toBeNull();
      expect(result.recommendedTierId).toBe(2); // Silver (100 <= 150 < 500)
      expect(result.shouldUpgrade).toBe(true);
      expect(result.shouldDowngrade).toBe(false);
      expect(result.metrics.totalPoints).toBe(150);
    });

    it('should calculate metrics correctly for MONTHLY window', async () => {
      const membershipId = 1;
      const tenantId = 1;

      const policy = TierPolicy.create(
        tenantId,
        'MONTHLY',
        'FIXED',
        { 1: 0 },
        30,
        0,
        'GRACE_PERIOD',
      );
      const tiers = [
        CustomerTier.create(
          tenantId,
          'Bronze',
          0,
          '#cd7f32',
          [],
          1,
          null,
          null,
          null,
          null,
          'active',
          1,
        ),
      ];

      const transactions = [
        PointsTransaction.createEarning(
          tenantId,
          1,
          membershipId,
          50,
          'key-1',
          'event-1',
          null,
          'SYSTEM',
          'EARNING',
          1,
          1,
          null,
          null,
        ),
        PointsTransaction.createEarning(
          tenantId,
          1,
          membershipId,
          30,
          'key-2',
          'event-2',
          null,
          'SYSTEM',
          'EARNING',
          1,
          1,
          null,
          null,
        ),
      ];

      policyRepository.findActiveByTenantId.mockResolvedValue(policy);
      statusRepository.findByMembershipId.mockResolvedValue(null);
      tierRepository.findByTenantId.mockResolvedValue(tiers);
      pointsTransactionRepository.findForTierEvaluation.mockResolvedValue(transactions);

      const result = await service.evaluateTier(membershipId, tenantId);

      expect(result.metrics.totalPoints).toBe(80);
      expect(result.metrics.totalEarnings).toBe(80);
      expect(result.metrics.transactionCount).toBe(2);
      expect(result.metrics.averagePointsPerTransaction).toBe(40);
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate metrics for ROLLING_30 window', async () => {
      const membershipId = 1;
      const transactions = [
        PointsTransaction.createEarning(
          1,
          1,
          membershipId,
          100,
          'key-1',
          'event-1',
          null,
          'SYSTEM',
          'EARNING',
          1,
          1,
          null,
          null,
        ),
      ];

      pointsTransactionRepository.findForTierEvaluation.mockResolvedValue(transactions);

      const metrics = await service.calculateMetrics(membershipId, 'ROLLING_30');

      expect(metrics.totalPoints).toBe(100);
      expect(pointsTransactionRepository.findForTierEvaluation).toHaveBeenCalled();
    });
  });
});
