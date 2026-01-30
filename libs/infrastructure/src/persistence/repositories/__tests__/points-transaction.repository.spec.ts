import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointsTransactionRepository } from '../points-transaction.repository';
import { PointsTransactionEntity } from '../../entities/points-transaction.entity';
import { PointsTransaction } from '@libs/domain';

describe('PointsTransactionRepository', () => {
  let repository: PointsTransactionRepository;
  let typeOrmRepository: Repository<PointsTransactionEntity>;

  const mockPointsTransactionEntity: PointsTransactionEntity = {
    id: 1,
    tenantId: 1,
    customerId: 100,
    membershipId: 50,
    programId: null,
    rewardRuleId: null,
    type: 'EARNING',
    pointsDelta: 100,
    idempotencyKey: 'idempotency-key-123',
    sourceEventId: 'source-event-789',
    correlationId: 'correlation-123',
    createdBy: 'admin-user',
    reasonCode: 'VISIT_BONUS',
    metadata: { visitId: 123 },
    reversalOfTransactionId: null,
    expiresAt: null,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    tenant: null as any,
    customer: null as any,
    membership: null as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsTransactionRepository,
        {
          provide: getRepositoryToken(PointsTransactionEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<PointsTransactionRepository>(PointsTransactionRepository);
    typeOrmRepository = module.get<Repository<PointsTransactionEntity>>(
      getRepositoryToken(PointsTransactionEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save a new points transaction', async () => {
      const transaction = PointsTransaction.createEarning(1, 100, 50, 100, 'idempotency-key-123');
      jest.spyOn(typeOrmRepository, 'save').mockResolvedValue(mockPointsTransactionEntity);

      const result = await repository.save(transaction);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.type).toBe('EARNING');
      expect(result.pointsDelta).toBe(100);
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a transaction when found', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(mockPointsTransactionEntity);

      const result = await repository.findById(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.type).toBe('EARNING');
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null when transaction not found', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdempotencyKey', () => {
    it('should return a transaction when found by idempotencyKey', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(mockPointsTransactionEntity);

      const result = await repository.findByIdempotencyKey('idempotency-key-123');

      expect(result).toBeDefined();
      expect(result?.idempotencyKey).toBe('idempotency-key-123');
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { idempotencyKey: 'idempotency-key-123' },
      });
    });

    it('should return null when transaction not found', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findByIdempotencyKey('non-existent-key');

      expect(result).toBeNull();
    });
  });

  describe('findByMembershipId', () => {
    it('should return all transactions for a membership', async () => {
      const entities = [mockPointsTransactionEntity];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(entities);

      const result = await repository.findByMembershipId(50);

      expect(result).toHaveLength(1);
      expect(result[0].membershipId).toBe(50);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { membershipId: 50 },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no transactions found', async () => {
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue([]);

      const result = await repository.findByMembershipId(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('findByMembershipIdAndType', () => {
    it('should return transactions filtered by membership and type', async () => {
      const entities = [mockPointsTransactionEntity];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(entities);

      const result = await repository.findByMembershipIdAndType(50, 'EARNING');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('EARNING');
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { membershipId: 50, type: 'EARNING' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findBySourceEventId', () => {
    it('should return transactions by sourceEventId', async () => {
      const entities = [mockPointsTransactionEntity];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(entities);

      const result = await repository.findBySourceEventId('source-event-789');

      expect(result).toHaveLength(1);
      expect(result[0].sourceEventId).toBe('source-event-789');
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { sourceEventId: 'source-event-789' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByCorrelationId', () => {
    it('should return transactions by correlationId', async () => {
      const entities = [mockPointsTransactionEntity];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(entities);

      const result = await repository.findByCorrelationId('correlation-123');

      expect(result).toHaveLength(1);
      expect(result[0].correlationId).toBe('correlation-123');
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { correlationId: 'correlation-123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('calculateBalance', () => {
    it('should calculate balance from all transactions', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ balance: '250' }),
      };
      jest.spyOn(typeOrmRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await repository.calculateBalance(50);

      expect(result).toBe(250);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('SUM(pt.pointsDelta)', 'balance');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('pt.membershipId = :membershipId', {
        membershipId: 50,
      });
    });

    it('should return 0 when no transactions exist', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ balance: null }),
      };
      jest.spyOn(typeOrmRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await repository.calculateBalance(999);

      expect(result).toBe(0);
    });
  });

  describe('calculateBalanceByProgram', () => {
    it('should calculate balance filtered by program', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ balance: '150' }),
      };
      jest.spyOn(typeOrmRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await repository.calculateBalanceByProgram(50, 10);

      expect(result).toBe(150);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('pt.programId = :programId', {
        programId: 10,
      });
    });
  });

  describe('findForTierEvaluation', () => {
    it('should return transactions within date range', async () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-01-31');
      const entities = [mockPointsTransactionEntity];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(entities);

      const result = await repository.findForTierEvaluation(50, fromDate, toDate);

      expect(result).toHaveLength(1);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          membershipId: 50,
          createdAt: expect.any(Object), // Between(fromDate, toDate)
        },
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findExpiringTransactions', () => {
    it('should return expiring transactions before date', async () => {
      const beforeDate = new Date('2025-01-01');
      const expiringEntity = {
        ...mockPointsTransactionEntity,
        expiresAt: new Date('2024-12-31'),
        type: 'EARNING' as const,
      };
      const entities = [expiringEntity];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(entities);

      const result = await repository.findExpiringTransactions(50, beforeDate);

      expect(result).toHaveLength(1);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          membershipId: 50,
          expiresAt: expect.any(Object), // LessThanOrEqual(beforeDate)
          type: 'EARNING',
        },
        order: { expiresAt: 'ASC' },
      });
    });
  });

  describe('findReversedTransaction', () => {
    it('should return original transaction when reversal found', async () => {
      const reversalEntity = {
        ...mockPointsTransactionEntity,
        id: 2,
        type: 'REVERSAL' as const,
        reversalOfTransactionId: 1,
      };
      jest
        .spyOn(typeOrmRepository, 'findOne')
        .mockResolvedValueOnce(reversalEntity)
        .mockResolvedValueOnce(mockPointsTransactionEntity);

      const result = await repository.findReversedTransaction(2);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
    });

    it('should return null when reversal transaction not found', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findReversedTransaction(999);

      expect(result).toBeNull();
    });

    it('should return null when reversal has no reversalOfTransactionId', async () => {
      const reversalEntity = {
        ...mockPointsTransactionEntity,
        id: 2,
        type: 'REVERSAL' as const,
        reversalOfTransactionId: null,
      };
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(reversalEntity);

      const result = await repository.findReversedTransaction(2);

      expect(result).toBeNull();
    });
  });

  describe('findReversalsOf', () => {
    it('should return all reversals of a transaction', async () => {
      const reversalEntity = {
        ...mockPointsTransactionEntity,
        id: 2,
        type: 'REVERSAL' as const,
        reversalOfTransactionId: 1,
      };
      const entities = [reversalEntity];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(entities);

      const result = await repository.findReversalsOf(1);

      expect(result).toHaveLength(1);
      expect(result[0].reversalOfTransactionId).toBe(1);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { reversalOfTransactionId: 1 },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
