import { Test, TestingModule } from '@nestjs/testing';
import { TierChangeService } from '../tier-change.service';
import { TierEvaluationService } from '../tier-evaluation.service';
import {
  CustomerMembership,
  TierPolicy,
  TierStatus,
  ICustomerMembershipRepository,
  ITierStatusRepository,
  ITierPolicyRepository,
  ICustomerTierRepository,
} from '@libs/domain';
import { TierEvaluationResult, TierMetrics } from '../tier-evaluation.service';

describe('TierChangeService', () => {
  let service: TierChangeService;
  let evaluationService: jest.Mocked<TierEvaluationService>;
  let membershipRepository: jest.Mocked<ICustomerMembershipRepository>;
  let statusRepository: jest.Mocked<ITierStatusRepository>;
  let policyRepository: jest.Mocked<ITierPolicyRepository>;
  let tierRepository: jest.Mocked<ICustomerTierRepository>;

  beforeEach(async () => {
    evaluationService = {
      evaluateTier: jest.fn(),
      evaluateTierWithPolicy: jest.fn(),
    } as any;

    membershipRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    statusRepository = {
      findByMembershipId: jest.fn(),
      save: jest.fn(),
      findPendingEvaluation: jest.fn(),
      findExpiringGracePeriods: jest.fn(),
    } as any;

    policyRepository = {
      findActiveByTenantId: jest.fn(),
    } as any;

    tierRepository = {} as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TierChangeService,
        {
          provide: TierEvaluationService,
          useValue: evaluationService,
        },
        {
          provide: 'ICustomerMembershipRepository',
          useValue: membershipRepository,
        },
        {
          provide: 'ITierStatusRepository',
          useValue: statusRepository,
        },
        {
          provide: 'ITierPolicyRepository',
          useValue: policyRepository,
        },
        {
          provide: 'ICustomerTierRepository',
          useValue: tierRepository,
        },
      ],
    }).compile();

    service = module.get<TierChangeService>(TierChangeService);
  });

  describe('evaluateAndApplyTierChange', () => {
    it('should apply upgrade when evaluation recommends it', async () => {
      const membershipId = 1;
      const tenantId = 1;

      const membership = CustomerMembership.create(
        1,
        1,
        null,
        150,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        membershipId,
      );
      const policy = TierPolicy.create(
        tenantId,
        'MONTHLY',
        'FIXED',
        { 1: 0, 2: 100 },
        30,
        0,
        'GRACE_PERIOD',
      );

      const evaluation: TierEvaluationResult = {
        currentTierId: 1,
        recommendedTierId: 2,
        shouldUpgrade: true,
        shouldDowngrade: false,
        reason: 'Upgrade recommended',
        metrics: {
          totalPoints: 150,
          totalEarnings: 150,
          totalSpent: 0,
          transactionCount: 1,
          averagePointsPerTransaction: 150,
        },
      };

      const currentStatus = TierStatus.create(membershipId, 1, new Date(), null, null);
      const newStatus = TierStatus.create(membershipId, 2, new Date(), null, new Date());

      membershipRepository.findById.mockResolvedValue(membership);
      evaluationService.evaluateTier.mockResolvedValue(evaluation);
      policyRepository.findActiveByTenantId.mockResolvedValue(policy);
      statusRepository.findByMembershipId.mockResolvedValue(currentStatus);
      statusRepository.save.mockResolvedValue(newStatus);
      membershipRepository.update.mockResolvedValue(membership.updateTier(2));

      const result = await service.evaluateAndApplyTierChange(membershipId, tenantId);

      expect(result.changeType).toBe('upgrade');
      expect(result.newTierId).toBe(2);
      expect(result.previousTierId).toBe(1);
      expect(statusRepository.save).toHaveBeenCalled();
      expect(membershipRepository.update).toHaveBeenCalled();
    });

    it('should start grace period for downgrade when policy uses grace period', async () => {
      const membershipId = 1;
      const tenantId = 1;

      const membership = CustomerMembership.create(
        1,
        1,
        null,
        50,
        2,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        membershipId,
      );
      const policy = TierPolicy.create(
        tenantId,
        'MONTHLY',
        'FIXED',
        { 1: 0, 2: 100 },
        30,
        0,
        'GRACE_PERIOD',
      );

      const evaluation: TierEvaluationResult = {
        currentTierId: 2,
        recommendedTierId: 1,
        shouldUpgrade: false,
        shouldDowngrade: true,
        reason: 'Downgrade recommended',
        metrics: {
          totalPoints: 50,
          totalEarnings: 50,
          totalSpent: 0,
          transactionCount: 1,
          averagePointsPerTransaction: 50,
        },
      };

      const currentStatus = TierStatus.create(membershipId, 2, new Date(), null, null);

      membershipRepository.findById.mockResolvedValue(membership);
      evaluationService.evaluateTier.mockResolvedValue(evaluation);
      policyRepository.findActiveByTenantId.mockResolvedValue(policy);
      statusRepository.findByMembershipId.mockResolvedValue(currentStatus);
      statusRepository.save.mockResolvedValue(currentStatus);

      const result = await service.evaluateAndApplyTierChange(membershipId, tenantId);

      expect(result.changeType).toBe('no_change'); // No cambia aún, solo inicia grace period
      expect(result.status.graceUntil).not.toBeNull();
      expect(statusRepository.save).toHaveBeenCalled();
      expect(membershipRepository.update).not.toHaveBeenCalled(); // No cambia tier aún
    });
  });

  describe('forceUpgrade', () => {
    it('should force upgrade immediately', async () => {
      const membershipId = 1;
      const tenantId = 1;
      const newTierId = 3;

      const membership = CustomerMembership.create(
        1,
        1,
        null,
        200,
        1,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        membershipId,
      );
      const policy = TierPolicy.create(
        tenantId,
        'MONTHLY',
        'FIXED',
        { 1: 0, 2: 100, 3: 200 },
        30,
        0,
        'GRACE_PERIOD',
      );
      const currentStatus = TierStatus.create(membershipId, 1, new Date(), null, null);
      const newStatus = TierStatus.create(membershipId, newTierId, new Date(), null, new Date());

      membershipRepository.findById.mockResolvedValue(membership);
      policyRepository.findActiveByTenantId.mockResolvedValue(policy);
      statusRepository.findByMembershipId.mockResolvedValue(currentStatus);
      statusRepository.save.mockResolvedValue(newStatus);
      membershipRepository.update.mockResolvedValue(membership.updateTier(newTierId));

      const result = await service.forceUpgrade(membershipId, newTierId, tenantId);

      expect(result.changeType).toBe('upgrade');
      expect(result.newTierId).toBe(newTierId);
      expect(result.previousTierId).toBe(1);
      expect(statusRepository.save).toHaveBeenCalled();
      expect(membershipRepository.update).toHaveBeenCalled();
    });
  });
});
