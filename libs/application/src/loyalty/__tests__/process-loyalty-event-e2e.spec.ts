import { Test, TestingModule } from '@nestjs/testing';
import { ProcessLoyaltyEventHandler } from '../process-loyalty-event/process-loyalty-event.handler';
import { EventNormalizer } from '../event-normalizer.service';
import { MembershipResolver } from '../membership-resolver.service';
import { ProgramCompatibilityResolver } from '../program-compatibility-resolver.service';
import { RewardRuleEvaluator } from '../reward-rule-evaluator.service';
import { ConflictResolver } from '../conflict-resolver.service';
import { IdempotencyKeyGenerator } from '../idempotency-key-generator.service';
import { BalanceSyncService } from '../balance-sync.service';
import { BalanceProjectionService } from '../balance-projection.service';
import {
  LoyaltyEvent,
  CustomerMembership,
  CustomerTier,
  LoyaltyProgram,
  RewardRule,
  PointsTransaction,
  ICustomerMembershipRepository,
  ICustomerTierRepository,
  IPointsTransactionRepository,
  IRewardRuleRepository,
  ILoyaltyProgramRepository,
  IEnrollmentRepository,
} from '@libs/domain';

/**
 * Tests de integración end-to-end para el sistema completo de lealtad
 * Estos tests validan el flujo completo desde un evento hasta la actualización de proyecciones
 */
describe('ProcessLoyaltyEventHandler - E2E Integration Tests', () => {
  let handler: ProcessLoyaltyEventHandler;
  let membershipRepository: jest.Mocked<ICustomerMembershipRepository>;
  let tierRepository: jest.Mocked<ICustomerTierRepository>;
  let pointsTransactionRepository: jest.Mocked<IPointsTransactionRepository>;
  let ruleRepository: jest.Mocked<IRewardRuleRepository>;
  let programRepository: jest.Mocked<ILoyaltyProgramRepository>;
  let enrollmentRepository: jest.Mocked<IEnrollmentRepository>;
  let balanceSyncService: jest.Mocked<BalanceSyncService>;
  let balanceProjectionService: jest.Mocked<BalanceProjectionService>;

  beforeEach(async () => {
    // Mock repositories
    membershipRepository = {
      findById: jest.fn(),
      findByQrCode: jest.fn(),
      findByCustomerIdAndTenantId: jest.fn(),
      updateBalanceFromLedger: jest.fn(),
    } as any;

    tierRepository = {
      findById: jest.fn(),
      findByPoints: jest.fn(),
    } as any;

    pointsTransactionRepository = {
      save: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      calculateBalance: jest.fn(),
    } as any;

    ruleRepository = {
      findActiveByProgramIdAndTrigger: jest.fn(),
      findById: jest.fn(),
    } as any;

    programRepository = {
      findById: jest.fn(),
    } as any;

    enrollmentRepository = {
      findActiveByMembershipId: jest.fn(),
    } as any;

    balanceSyncService = {
      syncAfterTransaction: jest.fn(),
    } as any;

    balanceProjectionService = {
      recalculateBalance: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessLoyaltyEventHandler,
        EventNormalizer,
        MembershipResolver,
        ProgramCompatibilityResolver,
        RewardRuleEvaluator,
        ConflictResolver,
        IdempotencyKeyGenerator,
        BalanceSyncService,
        BalanceProjectionService,
        {
          provide: 'ICustomerMembershipRepository',
          useValue: membershipRepository,
        },
        {
          provide: 'ICustomerTierRepository',
          useValue: tierRepository,
        },
        {
          provide: 'IPointsTransactionRepository',
          useValue: pointsTransactionRepository,
        },
        {
          provide: 'IRewardRuleRepository',
          useValue: ruleRepository,
        },
        {
          provide: 'ILoyaltyProgramRepository',
          useValue: programRepository,
        },
        {
          provide: 'IEnrollmentRepository',
          useValue: enrollmentRepository,
        },
      ],
    }).compile();

    handler = module.get<ProcessLoyaltyEventHandler>(ProcessLoyaltyEventHandler);
    balanceSyncService = module.get(BalanceSyncService);
    balanceProjectionService = module.get(BalanceProjectionService);
  });

  describe('End-to-End Flow: Event -> Ledger -> Projection', () => {
    it('should process a PURCHASE event and update balance projection', async () => {
      // Setup: Membership activa con 100 puntos iniciales
      const membership = CustomerMembership.create(
        1, // userId
        1, // tenantId
        null, // registrationBranchId
        100, // points (proyección inicial)
        null, // tierId
        0, // totalSpent
        0, // totalVisits
        null, // lastVisit
        new Date(), // joinedDate
        null, // qrCode
        'active', // status
        1, // id (opcional)
      );

      const program = LoyaltyProgram.create(
        1, // tenantId
        'Test Program', // name
        'BASE', // programType
        [{ domain: 'BASE_PURCHASE' }], // earningDomains
        1, // priorityRank
        { allowed: false }, // stacking
        { enabled: false, type: 'simple' }, // expirationPolicy
        100, // minPointsToRedeem
        null, // description
        null, // limits
        null, // currency
        'active', // status
        1, // version
        new Date(), // activeFrom
        null, // activeTo
        1, // id (opcional)
      );

      const rule = RewardRule.create(
        1, // programId
        'Rate Rule', // name
        'PURCHASE', // trigger
        { tenantId: 1, programId: 1 }, // scope
        {}, // eligibility
        {
          type: 'rate',
          rate: 0.1, // 10% del monto
          amountField: 'netAmount',
          roundingPolicy: 'floor',
        }, // pointsFormula
        {}, // limits
        {
          conflictGroup: 'CG_PURCHASE_BASE',
          stackPolicy: 'EXCLUSIVE',
          priorityRank: 0,
        }, // conflict
        { strategy: 'default' }, // idempotencyScope
        'BASE_PURCHASE', // earningDomain
        null, // description
        'active', // status
        1, // version
        new Date(), // activeFrom
        null, // activeTo
        1, // id (opcional)
      );

      const enrollment = {
        id: 1,
        membershipId: membership.id,
        programId: program.id,
        status: 'active',
        enrolledAt: new Date(),
        effectiveFrom: new Date(),
        effectiveTo: null,
      };

      // Mock repository responses
      membershipRepository.findById.mockResolvedValue(membership);
      enrollmentRepository.findActiveByMembershipId.mockResolvedValue([enrollment as any]);
      programRepository.findById.mockResolvedValue(program);
      ruleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([rule]);
      ruleRepository.findById.mockResolvedValue(rule);
      tierRepository.findById.mockResolvedValue(null);
      pointsTransactionRepository.findByIdempotencyKey.mockResolvedValue(null); // No existe aún

      // Mock transaction save
      const savedTransaction = PointsTransaction.createEarning(
        1, // tenantId
        1, // customerId
        membership.id, // membershipId
        10, // pointsDelta (10% de 100)
        'idempotency-key-123', // idempotencyKey
        'ORDER-123', // sourceEventId
        null, // correlationId
        'SYSTEM', // createdBy
        'EARNING', // reasonCode
        program.id, // programId
        rule.id, // rewardRuleId
        null, // metadata
        null, // expiresAt
      );
      Object.assign(savedTransaction, { id: 1 }); // Simular ID asignado por BD
      pointsTransactionRepository.save.mockResolvedValue(savedTransaction);

      // Mock balance sync
      const updatedMembership = CustomerMembership.create(
        membership.userId,
        membership.tenantId,
        membership.registrationBranchId,
        110, // points actualizados (100 + 10)
        membership.tierId,
        membership.totalSpent,
        membership.totalVisits,
        membership.lastVisit,
        membership.joinedDate,
        membership.qrCode,
        membership.status,
        membership.id,
      );
      balanceProjectionService.recalculateBalance.mockResolvedValue(updatedMembership);
      balanceSyncService.syncAfterTransaction.mockResolvedValue(undefined);

      // Execute: Procesar evento de compra
      const event: Partial<LoyaltyEvent> = {
        tenantId: 1,
        eventType: 'PURCHASE',
        sourceEventId: 'ORDER-123',
        occurredAt: new Date(),
        membershipRef: {
          membershipId: membership.id,
        },
        payload: {
          orderId: 'ORDER-123',
          netAmount: 100.0,
          grossAmount: 120.0,
          currency: 'GTQ',
          items: [],
        },
      };

      const result = await handler.execute(event);

      // Assertions
      expect(result.eventId).toBe('ORDER-123');
      expect(result.membershipId).toBe(membership.id);
      expect(result.totalPointsAwarded).toBe(10);
      expect(result.transactionsCreated).toHaveLength(1);
      expect(result.transactionsCreated[0]).toBe(1); // ID de transacción creada

      // Validar que se creó la transacción en el ledger
      expect(pointsTransactionRepository.save).toHaveBeenCalledTimes(1);
      const savedCall = pointsTransactionRepository.save.mock.calls[0][0];
      expect(savedCall.pointsDelta).toBe(10);
      expect(savedCall.type).toBe('EARNING');

      // Validar que se sincronizó el balance
      expect(balanceSyncService.syncAfterTransaction).toHaveBeenCalledWith(membership.id);
      expect(balanceProjectionService.recalculateBalance).toHaveBeenCalledWith(membership.id);
    });

    it('should handle idempotency: processing same event twice should not duplicate points', async () => {
      const membership = CustomerMembership.create(
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
      const program = LoyaltyProgram.create(
        1,
        'Test',
        'BASE',
        [{ domain: 'BASE_PURCHASE' }],
        1,
        { allowed: false },
        { enabled: false, type: 'simple' },
        100,
        null,
        null,
        null,
        'active',
        1,
        new Date(),
        null,
        1,
      );
      const rule = RewardRule.create(
        1,
        'Rate Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'rate', rate: 0.1, amountField: 'netAmount', roundingPolicy: 'floor' },
        {},
        { conflictGroup: 'CG_PURCHASE_BASE', stackPolicy: 'EXCLUSIVE', priorityRank: 0 },
        { strategy: 'default' },
        'BASE_PURCHASE',
        null,
        'active',
        1,
        new Date(),
        null,
        1,
      );

      const enrollment = {
        id: 1,
        membershipId: membership.id,
        programId: program.id,
        status: 'active',
        enrolledAt: new Date(),
        effectiveFrom: new Date(),
        effectiveTo: null,
      };

      membershipRepository.findById.mockResolvedValue(membership);
      enrollmentRepository.findActiveByMembershipId.mockResolvedValue([enrollment as any]);
      programRepository.findById.mockResolvedValue(program);
      ruleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([rule]);
      ruleRepository.findById.mockResolvedValue(rule);
      tierRepository.findById.mockResolvedValue(null);

      const existingTransaction = PointsTransaction.createEarning(
        1,
        1,
        membership.id,
        10,
        'idempotency-key-ORDER-123', // Misma key
        'ORDER-123',
        null,
        'SYSTEM',
        'EARNING',
        program.id,
        rule.id,
        null,
        null,
      );
      Object.assign(existingTransaction, { id: 1 });

      // Primera llamada: no existe transacción
      pointsTransactionRepository.findByIdempotencyKey
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingTransaction); // Segunda llamada: ya existe

      const savedTransaction = PointsTransaction.createEarning(
        1,
        1,
        membership.id,
        10,
        'idempotency-key-ORDER-123',
        'ORDER-123',
        null,
        'SYSTEM',
        'EARNING',
        program.id,
        rule.id,
        null,
        null,
      );
      Object.assign(savedTransaction, { id: 1 });
      pointsTransactionRepository.save.mockResolvedValue(savedTransaction);

      balanceProjectionService.recalculateBalance.mockResolvedValue(membership);
      balanceSyncService.syncAfterTransaction.mockResolvedValue(undefined);

      const event: Partial<LoyaltyEvent> = {
        tenantId: 1,
        eventType: 'PURCHASE',
        sourceEventId: 'ORDER-123',
        occurredAt: new Date(),
        membershipRef: { membershipId: membership.id },
        payload: {
          orderId: 'ORDER-123',
          netAmount: 100.0,
          grossAmount: 120.0,
          currency: 'GTQ',
          items: [],
        },
      };

      // Primera ejecución
      const result1 = await handler.execute(event);
      expect(result1.totalPointsAwarded).toBe(10);
      expect(result1.transactionsCreated).toHaveLength(1);
      expect(pointsTransactionRepository.save).toHaveBeenCalledTimes(1);

      // Segunda ejecución (mismo evento)
      const result2 = await handler.execute(event);
      expect(result2.totalPointsAwarded).toBe(10); // Mismo total
      expect(result2.transactionsCreated).toHaveLength(1);
      expect(result2.transactionsCreated[0]).toBe(1); // Misma transacción
      expect(pointsTransactionRepository.save).toHaveBeenCalledTimes(1); // No se creó otra transacción
    });

    it('should maintain integrity between ledger and projection', async () => {
      const membership = CustomerMembership.create(
        1,
        1,
        null,
        50,
        null,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        1,
      );
      const program = LoyaltyProgram.create(
        1,
        'Test',
        'BASE',
        [{ domain: 'BASE_PURCHASE' }],
        1,
        { allowed: false },
        { enabled: false, type: 'simple' },
        100,
        null,
        null,
        null,
        'active',
        1,
        new Date(),
        null,
        1,
      );
      const rule = RewardRule.create(
        1,
        'Rate Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'rate', rate: 0.1, amountField: 'netAmount', roundingPolicy: 'floor' },
        {},
        { conflictGroup: 'CG_PURCHASE_BASE', stackPolicy: 'EXCLUSIVE', priorityRank: 0 },
        { strategy: 'default' },
        'BASE_PURCHASE',
        null,
        'active',
        1,
        new Date(),
        null,
        1,
      );

      const enrollment = {
        id: 1,
        membershipId: membership.id,
        programId: program.id,
        status: 'active',
        enrolledAt: new Date(),
        effectiveFrom: new Date(),
        effectiveTo: null,
      };

      membershipRepository.findById.mockResolvedValue(membership);
      enrollmentRepository.findActiveByMembershipId.mockResolvedValue([enrollment as any]);
      programRepository.findById.mockResolvedValue(program);
      ruleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([rule]);
      ruleRepository.findById.mockResolvedValue(rule);
      tierRepository.findById.mockResolvedValue(null);
      pointsTransactionRepository.findByIdempotencyKey.mockResolvedValue(null);

      // Simular cálculo de balance desde ledger
      pointsTransactionRepository.calculateBalance.mockResolvedValue(60); // 50 inicial + 10 nuevos

      const savedTransaction = PointsTransaction.createEarning(
        1,
        1,
        membership.id,
        10,
        'idempotency-key-123',
        'ORDER-123',
        null,
        'SYSTEM',
        'EARNING',
        program.id,
        rule.id,
        null,
        null,
      );
      Object.assign(savedTransaction, { id: 1 });
      pointsTransactionRepository.save.mockResolvedValue(savedTransaction);

      // Proyección actualizada debe coincidir con el ledger
      const updatedMembership = CustomerMembership.create(
        membership.userId,
        membership.tenantId,
        membership.registrationBranchId,
        60, // Debe coincidir con calculateBalance
        membership.tierId,
        membership.totalSpent,
        membership.totalVisits,
        membership.lastVisit,
        membership.joinedDate,
        membership.qrCode,
        membership.status,
        membership.id,
      );
      balanceProjectionService.recalculateBalance.mockResolvedValue(updatedMembership);
      balanceSyncService.syncAfterTransaction.mockResolvedValue(undefined);

      const event: Partial<LoyaltyEvent> = {
        tenantId: 1,
        eventType: 'PURCHASE',
        sourceEventId: 'ORDER-123',
        occurredAt: new Date(),
        membershipRef: { membershipId: membership.id },
        payload: {
          orderId: 'ORDER-123',
          netAmount: 100.0,
          grossAmount: 120.0,
          currency: 'GTQ',
          items: [],
        },
      };

      const result = await handler.execute(event);

      // Validar integridad
      expect(result.totalPointsAwarded).toBe(10);
      expect(balanceProjectionService.recalculateBalance).toHaveBeenCalledWith(membership.id);

      // La proyección debe reflejar el balance del ledger
      const recalculatedMembership = await balanceProjectionService.recalculateBalance(
        membership.id,
      );
      expect(recalculatedMembership.points).toBe(60); // 50 inicial + 10 nuevos
    });

    it('should handle multiple programs with different rules correctly', async () => {
      const membership = CustomerMembership.create(
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

      const baseProgram = LoyaltyProgram.create(
        1,
        'Base Program',
        'BASE',
        [{ domain: 'BASE_PURCHASE' }],
        1,
        { allowed: false },
        { enabled: false, type: 'simple' },
        100,
        null,
        null,
        null,
        'active',
        1,
        new Date(),
        null,
        1,
      );
      const promoProgram = LoyaltyProgram.create(
        1,
        'Promo Program',
        'PROMO',
        [{ domain: 'BONUS_CATEGORY' }],
        2,
        { allowed: false },
        { enabled: false, type: 'simple' },
        100,
        null,
        null,
        null,
        'active',
        1,
        new Date(),
        null,
        2,
      );

      const baseRule = RewardRule.create(
        1,
        'Base Rule',
        'PURCHASE',
        { tenantId: 1, programId: 1 },
        {},
        { type: 'rate', rate: 0.1, amountField: 'netAmount', roundingPolicy: 'floor' },
        {},
        { conflictGroup: 'CG_PURCHASE_BASE', stackPolicy: 'EXCLUSIVE', priorityRank: 0 },
        { strategy: 'default' },
        'BASE_PURCHASE',
        null,
        'active',
        1,
        new Date(),
        null,
        1,
      );

      const promoRule = RewardRule.create(
        2,
        'Promo Rule',
        'PURCHASE',
        { tenantId: 1, programId: 2 },
        {},
        { type: 'fixed', points: 20 },
        {},
        { conflictGroup: 'CG_PURCHASE_BONUS_FIXED', stackPolicy: 'STACK', priorityRank: 0 },
        { strategy: 'default' },
        'BONUS_CATEGORY',
        null,
        'active',
        1,
        new Date(),
        null,
        2,
      );

      const enrollments = [
        {
          id: 1,
          membershipId: membership.id,
          programId: baseProgram.id,
          status: 'active',
          enrolledAt: new Date(),
          effectiveFrom: new Date(),
          effectiveTo: null,
        },
        {
          id: 2,
          membershipId: membership.id,
          programId: promoProgram.id,
          status: 'active',
          enrolledAt: new Date(),
          effectiveFrom: new Date(),
          effectiveTo: null,
        },
      ];

      membershipRepository.findById.mockResolvedValue(membership);
      enrollmentRepository.findActiveByMembershipId.mockResolvedValue(enrollments as any);
      programRepository.findById.mockImplementation((id) => {
        if (id === 1) return Promise.resolve(baseProgram);
        if (id === 2) return Promise.resolve(promoProgram);
        return Promise.resolve(null);
      });
      ruleRepository.findActiveByProgramIdAndTrigger.mockImplementation((programId) => {
        if (programId === 1) return Promise.resolve([baseRule]);
        if (programId === 2) return Promise.resolve([promoRule]);
        return Promise.resolve([]);
      });
      ruleRepository.findById.mockImplementation((id) => {
        if (id === 1) return Promise.resolve(baseRule);
        if (id === 2) return Promise.resolve(promoRule);
        return Promise.resolve(null);
      });
      tierRepository.findById.mockResolvedValue(null);
      pointsTransactionRepository.findByIdempotencyKey.mockResolvedValue(null);

      const savedTransaction1 = PointsTransaction.createEarning(
        1,
        1,
        membership.id,
        10,
        'idempotency-key-base',
        'ORDER-123',
        null,
        'SYSTEM',
        'EARNING',
        baseProgram.id,
        baseRule.id,
        null,
        null,
      );
      Object.assign(savedTransaction1, { id: 1 });

      const savedTransaction2 = PointsTransaction.createEarning(
        1,
        1,
        membership.id,
        20,
        'idempotency-key-promo',
        'ORDER-123',
        null,
        'SYSTEM',
        'EARNING',
        promoProgram.id,
        promoRule.id,
        null,
        null,
      );
      Object.assign(savedTransaction2, { id: 2 });

      pointsTransactionRepository.save
        .mockResolvedValueOnce(savedTransaction1)
        .mockResolvedValueOnce(savedTransaction2);

      const updatedMembership = CustomerMembership.create(
        membership.userId,
        membership.tenantId,
        membership.registrationBranchId,
        130, // 100 + 10 + 20
        membership.tierId,
        membership.totalSpent,
        membership.totalVisits,
        membership.lastVisit,
        membership.joinedDate,
        membership.qrCode,
        membership.status,
        membership.id,
      );
      balanceProjectionService.recalculateBalance.mockResolvedValue(updatedMembership);
      balanceSyncService.syncAfterTransaction.mockResolvedValue(undefined);

      const event: Partial<LoyaltyEvent> = {
        tenantId: 1,
        eventType: 'PURCHASE',
        sourceEventId: 'ORDER-123',
        occurredAt: new Date(),
        membershipRef: { membershipId: membership.id },
        payload: {
          orderId: 'ORDER-123',
          netAmount: 100.0,
          grossAmount: 120.0,
          currency: 'GTQ',
          items: [],
        },
      };

      const result = await handler.execute(event);

      // Validar que se procesaron ambos programas
      expect(result.programsProcessed).toContain(1);
      expect(result.programsProcessed).toContain(2);
      expect(result.totalPointsAwarded).toBe(30); // 10 + 20
      expect(result.transactionsCreated).toHaveLength(2);
      expect(balanceSyncService.syncAfterTransaction).toHaveBeenCalledWith(membership.id);
    });
  });
});
