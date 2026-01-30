import { Test, TestingModule } from '@nestjs/testing';
import { BalanceSyncService } from '../balance-sync.service';
import { BalanceProjectionService } from '../balance-projection.service';
import { IPointsTransactionRepository, CustomerMembership } from '@libs/domain';

describe('BalanceSyncService', () => {
  let service: BalanceSyncService;
  let balanceProjectionService: jest.Mocked<BalanceProjectionService>;
  let pointsTransactionRepository: jest.Mocked<IPointsTransactionRepository>;

  beforeEach(async () => {
    const mockBalanceProjectionService = {
      recalculateBalance: jest.fn(),
      recalculateBalancesBatch: jest.fn(),
    };

    const mockPointsTransactionRepository = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceSyncService,
        {
          provide: BalanceProjectionService,
          useValue: mockBalanceProjectionService,
        },
        {
          provide: 'IPointsTransactionRepository',
          useValue: mockPointsTransactionRepository,
        },
      ],
    }).compile();

    service = module.get<BalanceSyncService>(BalanceSyncService);
    balanceProjectionService = module.get(BalanceProjectionService);
    pointsTransactionRepository = module.get('IPointsTransactionRepository');
  });

  describe('syncBalanceAfterTransaction', () => {
    it('should sync balance synchronously', async () => {
      const membershipId = 1;
      const updatedMembership = CustomerMembership.create(
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

      balanceProjectionService.recalculateBalance.mockResolvedValue(updatedMembership);

      await service.syncBalanceAfterTransaction(membershipId, 'sync');

      expect(balanceProjectionService.recalculateBalance).toHaveBeenCalledWith(membershipId);
    });

    it('should sync balance asynchronously (currently also sync)', async () => {
      const membershipId = 1;
      const updatedMembership = CustomerMembership.create(
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

      balanceProjectionService.recalculateBalance.mockResolvedValue(updatedMembership);

      await service.syncBalanceAfterTransaction(membershipId, 'async');

      expect(balanceProjectionService.recalculateBalance).toHaveBeenCalledWith(membershipId);
    });
  });

  describe('syncBalancesBatch', () => {
    it('should sync balances for multiple memberships', async () => {
      const membershipIds = [1, 2, 3];
      const batchSize = 100;

      const updatedMembership1 = CustomerMembership.create(
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
        1,
      );
      const updatedMembership2 = CustomerMembership.create(
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
      const updatedMembership3 = CustomerMembership.create(
        3,
        1,
        null,
        250,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        3,
      );

      balanceProjectionService.recalculateBalancesBatch.mockResolvedValue([
        updatedMembership1,
        updatedMembership2,
        updatedMembership3,
      ]);

      const result = await service.syncBalancesBatch(membershipIds, batchSize);

      expect(result.synced).toBe(3);
      expect(result.errors).toBe(0);
      expect(balanceProjectionService.recalculateBalancesBatch).toHaveBeenCalledWith(membershipIds);
    });

    it('should process in batches if membershipIds exceed batchSize', async () => {
      const membershipIds = Array.from({ length: 250 }, (_, i) => i + 1);
      const batchSize = 100;

      const createMockMembership = (id: number) =>
        CustomerMembership.create(
          id,
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
          id,
        );

      // Mock para primer batch (100)
      balanceProjectionService.recalculateBalancesBatch
        .mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => createMockMembership(i + 1)))
        .mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => createMockMembership(i + 101)))
        .mockResolvedValueOnce(Array.from({ length: 50 }, (_, i) => createMockMembership(i + 201)));

      const result = await service.syncBalancesBatch(membershipIds, batchSize);

      expect(result.synced).toBe(250);
      expect(result.errors).toBe(0);
      expect(balanceProjectionService.recalculateBalancesBatch).toHaveBeenCalledTimes(3);
    });

    it('should count errors correctly', async () => {
      const membershipIds = [1, 2, 3];
      const batchSize = 100;

      const updatedMembership1 = CustomerMembership.create(
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
        1,
      );
      const updatedMembership3 = CustomerMembership.create(
        3,
        1,
        null,
        250,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        3,
      );

      // Solo 2 de 3 se actualizaron correctamente
      balanceProjectionService.recalculateBalancesBatch.mockResolvedValue([
        updatedMembership1,
        updatedMembership3,
      ]);

      const result = await service.syncBalancesBatch(membershipIds, batchSize);

      expect(result.synced).toBe(2);
      expect(result.errors).toBe(1);
    });
  });

  describe('syncAfterTransaction', () => {
    it('should sync balance after transaction', async () => {
      const membershipId = 1;
      const updatedMembership = CustomerMembership.create(
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

      balanceProjectionService.recalculateBalance.mockResolvedValue(updatedMembership);

      await service.syncAfterTransaction(membershipId);

      expect(balanceProjectionService.recalculateBalance).toHaveBeenCalledWith(membershipId);
    });
  });

  describe('repairInconsistentBalances', () => {
    it('should return 0 as placeholder (not yet implemented)', async () => {
      const result = await service.repairInconsistentBalances();

      expect(result).toBe(0);
    });

    it('should return 0 for tenant-specific repair (not yet implemented)', async () => {
      const tenantId = 1;
      const result = await service.repairInconsistentBalances(tenantId);

      expect(result).toBe(0);
    });
  });
});
