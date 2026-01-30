import { Test, TestingModule } from '@nestjs/testing';
import { BalanceProjectionService } from '../balance-projection.service';
import {
  IPointsTransactionRepository,
  ICustomerMembershipRepository,
  CustomerMembership,
} from '@libs/domain';

describe('BalanceProjectionService', () => {
  let service: BalanceProjectionService;
  let pointsTransactionRepository: jest.Mocked<IPointsTransactionRepository>;
  let membershipRepository: jest.Mocked<ICustomerMembershipRepository>;

  beforeEach(async () => {
    const mockPointsTransactionRepository = {
      calculateBalance: jest.fn(),
      calculateBalanceByProgram: jest.fn(),
    };

    const mockMembershipRepository = {
      findById: jest.fn(),
      updateBalanceFromLedger: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceProjectionService,
        {
          provide: 'IPointsTransactionRepository',
          useValue: mockPointsTransactionRepository,
        },
        {
          provide: 'ICustomerMembershipRepository',
          useValue: mockMembershipRepository,
        },
      ],
    }).compile();

    service = module.get<BalanceProjectionService>(BalanceProjectionService);
    pointsTransactionRepository = module.get('IPointsTransactionRepository');
    membershipRepository = module.get('ICustomerMembershipRepository');
  });

  describe('calculateMembershipBalance', () => {
    it('should calculate balance from ledger', async () => {
      const membershipId = 1;
      const expectedBalance = 150;

      pointsTransactionRepository.calculateBalance.mockResolvedValue(expectedBalance);

      const result = await service.calculateMembershipBalance(membershipId);

      expect(result).toBe(expectedBalance);
      expect(pointsTransactionRepository.calculateBalance).toHaveBeenCalledWith(membershipId);
    });

    it('should return 0 if no transactions exist', async () => {
      const membershipId = 1;

      pointsTransactionRepository.calculateBalance.mockResolvedValue(0);

      const result = await service.calculateMembershipBalance(membershipId);

      expect(result).toBe(0);
    });
  });

  describe('calculateProgramBalance', () => {
    it('should calculate balance for specific program', async () => {
      const membershipId = 1;
      const programId = 10;
      const expectedBalance = 75;

      pointsTransactionRepository.calculateBalanceByProgram.mockResolvedValue(expectedBalance);

      const result = await service.calculateProgramBalance(membershipId, programId);

      expect(result).toBe(expectedBalance);
      expect(pointsTransactionRepository.calculateBalanceByProgram).toHaveBeenCalledWith(
        membershipId,
        programId,
      );
    });
  });

  describe('recalculateBalance', () => {
    it('should recalculate and update balance from ledger', async () => {
      const membershipId = 1;
      const calculatedBalance = 200;
      const existingMembership = CustomerMembership.create(
        1,
        1,
        null,
        100, // points antiguos
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        membershipId,
      );
      const updatedMembership = CustomerMembership.create(
        1,
        1,
        null,
        calculatedBalance, // points nuevos
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        membershipId,
      );

      pointsTransactionRepository.calculateBalance.mockResolvedValue(calculatedBalance);
      membershipRepository.findById.mockResolvedValue(existingMembership);
      membershipRepository.updateBalanceFromLedger.mockResolvedValue(updatedMembership);

      const result = await service.recalculateBalance(membershipId);

      expect(result.points).toBe(calculatedBalance);
      expect(pointsTransactionRepository.calculateBalance).toHaveBeenCalledWith(membershipId);
      expect(membershipRepository.findById).toHaveBeenCalledWith(membershipId);
      expect(membershipRepository.updateBalanceFromLedger).toHaveBeenCalledWith(
        membershipId,
        calculatedBalance,
      );
    });

    it('should throw error if membership not found', async () => {
      const membershipId = 999;

      pointsTransactionRepository.calculateBalance.mockResolvedValue(100);
      membershipRepository.findById.mockResolvedValue(null);

      await expect(service.recalculateBalance(membershipId)).rejects.toThrow(
        `Membership with ID ${membershipId} not found`,
      );
    });
  });

  describe('recalculateBalancesBatch', () => {
    it('should recalculate balances for multiple memberships', async () => {
      const membershipIds = [1, 2, 3];
      const calculatedBalance = 150;

      pointsTransactionRepository.calculateBalance.mockResolvedValue(calculatedBalance);

      const membership1 = CustomerMembership.create(
        1,
        1,
        null,
        100,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        1,
      );
      const membership2 = CustomerMembership.create(
        2,
        1,
        null,
        200,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        2,
      );
      const membership3 = CustomerMembership.create(
        3,
        1,
        null,
        300,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        3,
      );

      const updatedMembership1 = CustomerMembership.create(
        1,
        1,
        null,
        calculatedBalance,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        1,
      );
      const updatedMembership2 = CustomerMembership.create(
        2,
        1,
        null,
        calculatedBalance,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        2,
      );
      const updatedMembership3 = CustomerMembership.create(
        3,
        1,
        null,
        calculatedBalance,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        3,
      );

      membershipRepository.findById
        .mockResolvedValueOnce(membership1)
        .mockResolvedValueOnce(membership2)
        .mockResolvedValueOnce(membership3);

      membershipRepository.updateBalanceFromLedger
        .mockResolvedValueOnce(updatedMembership1)
        .mockResolvedValueOnce(updatedMembership2)
        .mockResolvedValueOnce(updatedMembership3);

      const result = await service.recalculateBalancesBatch(membershipIds);

      expect(result).toHaveLength(3);
      expect(result[0].points).toBe(calculatedBalance);
      expect(result[1].points).toBe(calculatedBalance);
      expect(result[2].points).toBe(calculatedBalance);
    });

    it('should continue processing even if one membership fails', async () => {
      const membershipIds = [1, 2, 3];
      const calculatedBalance = 150;

      pointsTransactionRepository.calculateBalance.mockResolvedValue(calculatedBalance);

      const membership1 = CustomerMembership.create(
        1,
        1,
        null,
        100,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        1,
      );
      const membership3 = CustomerMembership.create(
        3,
        1,
        null,
        300,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        3,
      );

      const updatedMembership1 = CustomerMembership.create(
        1,
        1,
        null,
        calculatedBalance,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        1,
      );
      const updatedMembership3 = CustomerMembership.create(
        3,
        1,
        null,
        calculatedBalance,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        3,
      );

      membershipRepository.findById
        .mockResolvedValueOnce(membership1)
        .mockResolvedValueOnce(null) // membership 2 not found - error
        .mockResolvedValueOnce(membership3);

      membershipRepository.updateBalanceFromLedger
        .mockResolvedValueOnce(updatedMembership1)
        .mockResolvedValueOnce(updatedMembership3);

      const result = await service.recalculateBalancesBatch(membershipIds);

      expect(result).toHaveLength(2);
      expect(result[0].points).toBe(calculatedBalance);
      expect(result[1].points).toBe(calculatedBalance);
    });
  });

  describe('validateBalanceIntegrity', () => {
    it('should return true if balance matches', async () => {
      const membershipId = 1;
      const balance = 150;
      const membership = CustomerMembership.create(
        1,
        1,
        null,
        balance,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        membershipId,
      );

      membershipRepository.findById.mockResolvedValue(membership);
      pointsTransactionRepository.calculateBalance.mockResolvedValue(balance);

      const result = await service.validateBalanceIntegrity(membershipId);

      expect(result).toBe(true);
    });

    it('should return false if balance does not match', async () => {
      const membershipId = 1;
      const projectedBalance = 150;
      const calculatedBalance = 200;
      const membership = CustomerMembership.create(
        1,
        1,
        null,
        projectedBalance,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        membershipId,
      );

      membershipRepository.findById.mockResolvedValue(membership);
      pointsTransactionRepository.calculateBalance.mockResolvedValue(calculatedBalance);

      const result = await service.validateBalanceIntegrity(membershipId);

      expect(result).toBe(false);
    });

    it('should return false if membership not found', async () => {
      const membershipId = 999;

      membershipRepository.findById.mockResolvedValue(null);

      const result = await service.validateBalanceIntegrity(membershipId);

      expect(result).toBe(false);
    });
  });
});
