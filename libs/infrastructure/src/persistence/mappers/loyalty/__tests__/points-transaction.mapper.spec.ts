import { PointsTransaction } from '@libs/domain';
import { PointsTransactionEntity } from '../../../entities/loyalty/points-transaction.entity';
import { PointsTransactionMapper } from '../points-transaction.mapper';

describe('PointsTransactionMapper', () => {
  describe('toDomain', () => {
    it('should map persistence entity to domain entity with all fields', () => {
      const persistenceEntity: PointsTransactionEntity = {
        id: 1,
        tenantId: 1,
        customerId: 100,
        membershipId: 50,
        programId: 10,
        rewardRuleId: 5,
        type: 'EARNING',
        pointsDelta: 100,
        idempotencyKey: 'idempotency-key-123',
        sourceEventId: 'source-event-789',
        correlationId: 'correlation-123',
        createdBy: 'admin-user',
        reasonCode: 'VISIT_BONUS',
        metadata: { visitId: 123 },
        reversalOfTransactionId: null,
        expiresAt: new Date('2025-01-01T10:00:00Z'),
        rewardId: null,
        branchId: 2,
        amount: null, // ← NUEVO: VISIT no tiene revenue
        currency: null, // ← NUEVO
        createdAt: new Date('2024-01-01T10:00:00Z'),
        tenant: null as any,
        customer: null as any,
        membership: null as any,
        reward: null as any,
        branch: null as any,
      };

      const domainEntity = PointsTransactionMapper.toDomain(persistenceEntity);

      expect(domainEntity).toBeInstanceOf(PointsTransaction);
      expect(domainEntity.id).toBe(1);
      expect(domainEntity.tenantId).toBe(1);
      expect(domainEntity.customerId).toBe(100);
      expect(domainEntity.membershipId).toBe(50);
      expect(domainEntity.programId).toBe(10);
      expect(domainEntity.rewardRuleId).toBe(5);
      expect(domainEntity.type).toBe('EARNING');
      expect(domainEntity.pointsDelta).toBe(100);
      expect(domainEntity.idempotencyKey).toBe('idempotency-key-123');
      expect(domainEntity.sourceEventId).toBe('source-event-789');
      expect(domainEntity.correlationId).toBe('correlation-123');
      expect(domainEntity.createdBy).toBe('admin-user');
      expect(domainEntity.reasonCode).toBe('VISIT_BONUS');
      expect(domainEntity.metadata).toEqual({ visitId: 123 });
      expect(domainEntity.reversalOfTransactionId).toBeNull();
      expect(domainEntity.expiresAt).toEqual(new Date('2025-01-01T10:00:00Z'));
      expect(domainEntity.rewardId).toBeNull();
      expect(domainEntity.branchId).toBe(2);
      expect(domainEntity.createdAt).toEqual(new Date('2024-01-01T10:00:00Z'));
    });

    it('should map persistence entity with null branchId to domain entity', () => {
      const persistenceEntity: PointsTransactionEntity = {
        id: 2,
        tenantId: 1,
        customerId: 100,
        membershipId: 50,
        programId: null,
        rewardRuleId: null,
        type: 'ADJUSTMENT',
        pointsDelta: 50,
        idempotencyKey: 'idempotency-key-456',
        sourceEventId: null,
        correlationId: null,
        createdBy: 'admin',
        reasonCode: 'CORRECTION',
        metadata: null,
        reversalOfTransactionId: null,
        expiresAt: null,
        rewardId: null,
        branchId: null,
        amount: null, // ← NUEVO: ADJUSTMENT no tiene revenue
        currency: null, // ← NUEVO
        createdAt: new Date('2024-01-02T10:00:00Z'),
        tenant: null as any,
        customer: null as any,
        membership: null as any,
        reward: null as any,
        branch: null as any,
      };

      const domainEntity = PointsTransactionMapper.toDomain(persistenceEntity);

      expect(domainEntity.id).toBe(2);
      expect(domainEntity.type).toBe('ADJUSTMENT');
      expect(domainEntity.pointsDelta).toBe(50);
      expect(domainEntity.branchId).toBeNull();
    });

    it('should map REDEEM transaction with branchId and rewardId', () => {
      const persistenceEntity: PointsTransactionEntity = {
        id: 3,
        tenantId: 1,
        customerId: 100,
        membershipId: 50,
        programId: null,
        rewardRuleId: null,
        type: 'REDEEM',
        pointsDelta: -75,
        idempotencyKey: 'idempotency-key-redeem',
        sourceEventId: null,
        correlationId: null,
        createdBy: 'USER_123',
        reasonCode: 'REWARD_REDEMPTION',
        metadata: { rewardName: 'Free Coffee' },
        reversalOfTransactionId: null,
        expiresAt: null,
        rewardId: 456,
        branchId: 3,
        amount: null, // ← NUEVO: REDEEM no tiene revenue
        currency: null, // ← NUEVO
        createdAt: new Date('2024-01-03T10:00:00Z'),
        tenant: null as any,
        customer: null as any,
        membership: null as any,
        reward: null as any,
        branch: null as any,
      };

      const domainEntity = PointsTransactionMapper.toDomain(persistenceEntity);

      expect(domainEntity.type).toBe('REDEEM');
      expect(domainEntity.pointsDelta).toBe(-75);
      expect(domainEntity.rewardId).toBe(456);
      expect(domainEntity.branchId).toBe(3);
      expect(domainEntity.metadata).toEqual({ rewardName: 'Free Coffee' });
    });
  });

  describe('toPersistence', () => {
    it('should map domain entity to persistence entity with all fields', () => {
      const domainEntity = new PointsTransaction(
        1, // id
        1, // tenantId
        100, // customerId
        50, // membershipId
        10, // programId
        5, // rewardRuleId
        'EARNING',
        100, // pointsDelta
        'idempotency-key-123',
        'source-event-789',
        'correlation-123',
        'admin-user',
        'VISIT_BONUS',
        { visitId: 123 },
        null, // reversalOfTransactionId
        new Date('2025-01-01T10:00:00Z'), // expiresAt
        null, // rewardId
        2, // branchId
        null, // amount ← NUEVO: VISIT no tiene revenue
        null, // currency ← NUEVO
        new Date('2024-01-01T10:00:00Z'),
      );

      const persistenceEntity = PointsTransactionMapper.toPersistence(domainEntity);

      expect(persistenceEntity).toBeInstanceOf(PointsTransactionEntity);
      expect(persistenceEntity.id).toBe(1);
      expect(persistenceEntity.tenantId).toBe(1);
      expect(persistenceEntity.customerId).toBe(100);
      expect(persistenceEntity.membershipId).toBe(50);
      expect(persistenceEntity.programId).toBe(10);
      expect(persistenceEntity.rewardRuleId).toBe(5);
      expect(persistenceEntity.type).toBe('EARNING');
      expect(persistenceEntity.pointsDelta).toBe(100);
      expect(persistenceEntity.idempotencyKey).toBe('idempotency-key-123');
      expect(persistenceEntity.sourceEventId).toBe('source-event-789');
      expect(persistenceEntity.correlationId).toBe('correlation-123');
      expect(persistenceEntity.createdBy).toBe('admin-user');
      expect(persistenceEntity.reasonCode).toBe('VISIT_BONUS');
      expect(persistenceEntity.metadata).toEqual({ visitId: 123 });
      expect(persistenceEntity.reversalOfTransactionId).toBeNull();
      expect(persistenceEntity.expiresAt).toEqual(new Date('2025-01-01T10:00:00Z'));
      expect(persistenceEntity.rewardId).toBeNull();
      expect(persistenceEntity.branchId).toBe(2);
      expect(persistenceEntity.createdAt).toEqual(new Date('2024-01-01T10:00:00Z'));
    });

    it('should map domain entity with null branchId to persistence entity', () => {
      const domainEntity = new PointsTransaction(
        2,
        1,
        100,
        50,
        null,
        null,
        'ADJUSTMENT',
        50,
        'idempotency-key-456',
        null,
        null,
        'admin',
        'CORRECTION',
        null,
        null,
        null,
        null,
        null, // branchId
        null, // amount ← NUEVO
        null, // currency ← NUEVO
        new Date('2024-01-02T10:00:00Z'),
      );

      const persistenceEntity = PointsTransactionMapper.toPersistence(domainEntity);

      expect(persistenceEntity.id).toBe(2);
      expect(persistenceEntity.type).toBe('ADJUSTMENT');
      expect(persistenceEntity.pointsDelta).toBe(50);
      expect(persistenceEntity.branchId).toBeNull();
    });

    it('should map REDEEM domain entity with branchId and rewardId', () => {
      const domainEntity = new PointsTransaction(
        3,
        1,
        100,
        50,
        null,
        null,
        'REDEEM',
        -75,
        'idempotency-key-redeem',
        null,
        null,
        'USER_123',
        'REWARD_REDEMPTION',
        { rewardName: 'Free Coffee' },
        null,
        null,
        456, // rewardId
        3, // branchId
        null, // amount ← NUEVO
        null, // currency ← NUEVO
        new Date('2024-01-03T10:00:00Z'),
      );

      const persistenceEntity = PointsTransactionMapper.toPersistence(domainEntity);

      expect(persistenceEntity.type).toBe('REDEEM');
      expect(persistenceEntity.pointsDelta).toBe(-75);
      expect(persistenceEntity.rewardId).toBe(456);
      expect(persistenceEntity.branchId).toBe(3);
      expect(persistenceEntity.metadata).toEqual({ rewardName: 'Free Coffee' });
    });

    it('should not assign id if it is 0 (new transaction)', () => {
      const domainEntity = new PointsTransaction(
        0, // id = 0 significa nueva transacción
        1,
        100,
        50,
        null,
        null,
        'EARNING',
        100,
        'idempotency-key-new',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        5, // branchId
        null, // amount ← NUEVO
        null, // currency ← NUEVO
        new Date(),
      );

      const persistenceEntity = PointsTransactionMapper.toPersistence(domainEntity);

      expect(persistenceEntity.id).toBeUndefined();
      expect(persistenceEntity.type).toBe('EARNING');
      expect(persistenceEntity.pointsDelta).toBe(100);
      expect(persistenceEntity.branchId).toBe(5);
    });
  });

  describe('bidirectional mapping', () => {
    it('should maintain data integrity through toDomain -> toPersistence cycle', () => {
      const originalPersistence: PointsTransactionEntity = {
        id: 100,
        tenantId: 1,
        customerId: 200,
        membershipId: 75,
        programId: 15,
        rewardRuleId: 8,
        type: 'EARNING',
        pointsDelta: 250,
        idempotencyKey: 'test-key',
        sourceEventId: 'test-event',
        correlationId: 'test-correlation',
        createdBy: 'test-user',
        reasonCode: 'TEST_REASON',
        metadata: { test: 'data' },
        reversalOfTransactionId: null,
        expiresAt: new Date('2026-01-01'),
        rewardId: null,
        branchId: 7,
        amount: null, // ← NUEVO
        currency: null, // ← NUEVO
        createdAt: new Date('2024-01-01'),
        tenant: null as any,
        customer: null as any,
        membership: null as any,
        reward: null as any,
        branch: null as any,
      };

      const domain = PointsTransactionMapper.toDomain(originalPersistence);
      const backToPersistence = PointsTransactionMapper.toPersistence(domain);

      expect(backToPersistence.id).toBe(originalPersistence.id);
      expect(backToPersistence.tenantId).toBe(originalPersistence.tenantId);
      expect(backToPersistence.customerId).toBe(originalPersistence.customerId);
      expect(backToPersistence.membershipId).toBe(originalPersistence.membershipId);
      expect(backToPersistence.programId).toBe(originalPersistence.programId);
      expect(backToPersistence.rewardRuleId).toBe(originalPersistence.rewardRuleId);
      expect(backToPersistence.type).toBe(originalPersistence.type);
      expect(backToPersistence.pointsDelta).toBe(originalPersistence.pointsDelta);
      expect(backToPersistence.idempotencyKey).toBe(originalPersistence.idempotencyKey);
      expect(backToPersistence.sourceEventId).toBe(originalPersistence.sourceEventId);
      expect(backToPersistence.correlationId).toBe(originalPersistence.correlationId);
      expect(backToPersistence.createdBy).toBe(originalPersistence.createdBy);
      expect(backToPersistence.reasonCode).toBe(originalPersistence.reasonCode);
      expect(backToPersistence.metadata).toEqual(originalPersistence.metadata);
      expect(backToPersistence.reversalOfTransactionId).toBe(
        originalPersistence.reversalOfTransactionId,
      );
      expect(backToPersistence.expiresAt).toEqual(originalPersistence.expiresAt);
      expect(backToPersistence.rewardId).toBe(originalPersistence.rewardId);
      expect(backToPersistence.branchId).toBe(originalPersistence.branchId);
      expect(backToPersistence.createdAt).toEqual(originalPersistence.createdAt);
    });
  });
});
