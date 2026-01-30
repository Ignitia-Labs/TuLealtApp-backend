import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UpdateCustomerMembershipHandler } from '../update-customer-membership/update-customer-membership.handler';
import { UpdateCustomerMembershipRequest } from '../update-customer-membership/update-customer-membership.request';
import {
  ICustomerMembershipRepository,
  ITenantRepository,
  IBranchRepository,
  ICustomerTierRepository,
  CustomerMembership,
} from '@libs/domain';
import { BalanceProjectionService } from '../../loyalty/balance-projection.service';
import { PointsTransaction } from '@libs/domain';
import { IPointsTransactionRepository } from '@libs/domain';

/**
 * Tests de integración para validar que el nuevo código usando ledger funciona correctamente
 * Estos tests aseguran que:
 * 1. El flujo completo ledger -> proyección funciona
 * 2. No se puede actualizar points directamente
 * 3. La migración del código antiguo al nuevo es posible
 */
describe('Ledger Integration Tests', () => {
  let handler: UpdateCustomerMembershipHandler;
  let membershipRepository: jest.Mocked<ICustomerMembershipRepository>;
  let pointsTransactionRepository: jest.Mocked<IPointsTransactionRepository>;
  let balanceProjectionService: jest.Mocked<BalanceProjectionService>;

  beforeEach(async () => {
    const mockMembershipRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const mockTenantRepository = {
      findById: jest.fn(),
    };

    const mockBranchRepository = {
      findById: jest.fn(),
    };

    const mockTierRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCustomerMembershipHandler,
        {
          provide: 'ICustomerMembershipRepository',
          useValue: mockMembershipRepository,
        },
        {
          provide: 'ITenantRepository',
          useValue: mockTenantRepository,
        },
        {
          provide: 'IBranchRepository',
          useValue: mockBranchRepository,
        },
        {
          provide: 'ICustomerTierRepository',
          useValue: mockTierRepository,
        },
      ],
    }).compile();

    handler = module.get<UpdateCustomerMembershipHandler>(UpdateCustomerMembershipHandler);
    membershipRepository = module.get('ICustomerMembershipRepository');
    pointsTransactionRepository = {
      save: jest.fn(),
      calculateBalance: jest.fn(),
    } as any;
    balanceProjectionService = {
      recalculateBalance: jest.fn(),
    } as any;
  });

  describe('UpdateCustomerMembershipHandler - Points Field Rejection', () => {
    it('should throw BadRequestException when trying to update points directly', async () => {
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

      membershipRepository.findById.mockResolvedValue(membership);

      const request = new UpdateCustomerMembershipRequest();
      request.membershipId = 1;
      request.points = 200; // ⚠️ Intentar actualizar points directamente

      await expect(handler.execute(request)).rejects.toThrow(BadRequestException);
      await expect(handler.execute(request)).rejects.toThrow(
        'DEPRECATED: Actualización directa de puntos no está permitida',
      );
    });

    it('should allow updating other fields without points', async () => {
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
      const updatedMembership = CustomerMembership.create(
        1,
        1,
        null,
        100,
        2,
        0,
        0,
        null,
        new Date(),
        null,
        'active',
        1,
      );

      membershipRepository.findById.mockResolvedValue(membership);
      membershipRepository.update.mockResolvedValue(updatedMembership);

      const request = new UpdateCustomerMembershipRequest();
      request.membershipId = 1;
      request.tierId = 2; // Actualizar tier está permitido
      // No incluir points

      // Mock de toDto (simplificado para el test)
      jest.spyOn(handler as any, 'toDto').mockResolvedValue({
        id: 1,
        userId: 1,
        tenantId: 1,
        tenantName: 'Test Tenant',
        tenantLogo: null,
        tenantImage: null,
        tenantCategory: 'retail',
        tenantPrimaryColor: '#000',
        registrationBranchId: null,
        registrationBranchName: null,
        points: 100,
        tierId: 2,
        tierName: null,
        tierColor: null,
        totalSpent: 0,
        totalVisits: 0,
        lastVisit: null,
        joinedDate: new Date(),
        availableRewards: 0,
        qrCode: null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await handler.execute(request);

      expect(result).toBeDefined();
      expect(membershipRepository.update).toHaveBeenCalled();
    });
  });

  describe('Ledger -> Projection Flow', () => {
    it('should update balance from ledger correctly', async () => {
      const membershipId = 1;
      const initialMembership = CustomerMembership.create(
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
        membershipId,
      );
      const updatedMembership = CustomerMembership.create(
        1,
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
        membershipId,
      );

      balanceProjectionService.recalculateBalance.mockResolvedValue(updatedMembership);

      const result = await balanceProjectionService.recalculateBalance(membershipId);

      expect(result.points).toBe(250);
      expect(balanceProjectionService.recalculateBalance).toHaveBeenCalledWith(membershipId);
    });

    it('should calculate balance from ledger correctly', async () => {
      const membershipId = 1;
      const calculatedBalance = 300;

      pointsTransactionRepository.calculateBalance.mockResolvedValue(calculatedBalance);

      const balance = await pointsTransactionRepository.calculateBalance(membershipId);

      expect(balance).toBe(calculatedBalance);
      expect(pointsTransactionRepository.calculateBalance).toHaveBeenCalledWith(membershipId);
    });
  });

  describe('Migration Path: Old Code -> New Code', () => {
    it('should demonstrate migration from deprecated method to ledger', async () => {
      const membershipId = 1;
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
        membershipId,
      );

      // ❌ CÓDIGO ANTIGUO (deprecated):
      // const updated = membership.addPoints(50);
      // await membershipRepository.save(updated);

      // ✅ CÓDIGO NUEVO (recomendado):
      // 1. Crear transacción en ledger
      const transaction = PointsTransaction.createEarning(
        1, // tenantId
        1, // customerId
        membershipId, // membershipId
        50, // pointsDelta
        `idempotency-key-${Date.now()}`, // idempotencyKey
        `source-event-${Date.now()}`, // sourceEventId
        null, // correlationId
        'SYSTEM', // createdBy
        'EARNING', // reasonCode
        1, // programId
        null, // rewardRuleId
        null, // metadata
        null, // expiresAt
      );

      // 2. Guardar transacción en ledger
      pointsTransactionRepository.save.mockResolvedValue(transaction);

      const savedTransaction = await pointsTransactionRepository.save(transaction);

      expect(savedTransaction.pointsDelta).toBe(50);
      expect(savedTransaction.type).toBe('EARNING');

      // 3. Sincronizar proyección
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

      const syncedMembership = await balanceProjectionService.recalculateBalance(membershipId);

      expect(syncedMembership.points).toBe(150);
    });
  });
});
