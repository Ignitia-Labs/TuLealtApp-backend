import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatePointsAdjustmentHandler } from '../create-points-adjustment.handler';
import { AdjustmentService } from '../../../loyalty/adjustment.service';
import { CreatePointsAdjustmentRequest } from '../create-points-adjustment.request';
import { PointsTransaction } from '@libs/domain';

describe('CreatePointsAdjustmentHandler - branchId Tests', () => {
  let handler: CreatePointsAdjustmentHandler;
  let adjustmentService: jest.Mocked<AdjustmentService>;
  let membershipRepository: any;
  let pointsTransactionRepository: any;
  let tenantRepository: any;

  const mockMembership = {
    id: 50,
    tenantId: 1,
    userId: 100,
    points: 500,
    status: 'active',
  };

  const mockTenant = {
    id: 1,
    partnerId: 10,
    name: 'Test Tenant',
  };

  beforeEach(async () => {
    // Mock repositories
    membershipRepository = {
      findById: jest.fn(),
    };

    pointsTransactionRepository = {
      save: jest.fn(),
      calculateBalance: jest.fn(),
    };

    tenantRepository = {
      findById: jest.fn(),
    };

    // Mock AdjustmentService
    adjustmentService = {
      createAdjustment: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePointsAdjustmentHandler,
        {
          provide: 'ICustomerMembershipRepository',
          useValue: membershipRepository,
        },
        {
          provide: 'IPointsTransactionRepository',
          useValue: pointsTransactionRepository,
        },
        {
          provide: 'ITenantRepository',
          useValue: tenantRepository,
        },
        {
          provide: AdjustmentService,
          useValue: adjustmentService,
        },
      ],
    }).compile();

    handler = module.get<CreatePointsAdjustmentHandler>(CreatePointsAdjustmentHandler);
  });

  describe('execute - with branchId', () => {
    it('should create adjustment with branchId when provided', async () => {
      // Arrange
      const request = new CreatePointsAdjustmentRequest();
      request.membershipId = 50;
      request.pointsDelta = 100;
      request.reasonCode = 'BONUS_BIRTHDAY';
      request.branchId = 2;
      request.metadata = { birthdayMonth: 3 };

      const mockTransaction = new PointsTransaction(
        1,
        1,
        100,
        50,
        null,
        null,
        'ADJUSTMENT',
        100,
        'test-key',
        null,
        null,
        'USER_123',
        'BONUS_BIRTHDAY',
        { birthdayMonth: 3 },
        null,
        null,
        null,
        2, // branchId
        null, // amount ← NUEVO: ADJUSTMENT no tiene revenue
        null, // currency ← NUEVO
        new Date(),
      );

      membershipRepository.findById.mockResolvedValue(mockMembership);
      tenantRepository.findById.mockResolvedValue(mockTenant);
      adjustmentService.createAdjustment.mockResolvedValue(mockTransaction);
      pointsTransactionRepository.calculateBalance.mockResolvedValue(600);

      // Act
      const result = await handler.execute(request, 10, 'USER_123');

      // Assert
      expect(membershipRepository.findById).toHaveBeenCalledWith(50);
      expect(tenantRepository.findById).toHaveBeenCalledWith(1);
      expect(adjustmentService.createAdjustment).toHaveBeenCalledWith(
        50,
        100,
        'BONUS_BIRTHDAY',
        'USER_123',
        2, // branchId passed correctly
        { birthdayMonth: 3 },
      );
      expect(result.transactionId).toBe(1);
      expect(result.branchId).toBe(2);
      expect(result.newBalance).toBe(600);
    });

    it('should create adjustment without branchId when not provided', async () => {
      // Arrange
      const request = new CreatePointsAdjustmentRequest();
      request.membershipId = 50;
      request.pointsDelta = -50;
      request.reasonCode = 'CORRECTION';
      // branchId not provided

      const mockTransaction = new PointsTransaction(
        2,
        1,
        100,
        50,
        null,
        null,
        'ADJUSTMENT',
        -50,
        'test-key-2',
        null,
        null,
        'USER_456',
        'CORRECTION',
        null,
        null,
        null,
        null,
        null, // branchId null
        null, // amount ← NUEVO
        null, // currency ← NUEVO
        new Date(),
      );

      membershipRepository.findById.mockResolvedValue(mockMembership);
      tenantRepository.findById.mockResolvedValue(mockTenant);
      adjustmentService.createAdjustment.mockResolvedValue(mockTransaction);
      pointsTransactionRepository.calculateBalance.mockResolvedValue(450);

      // Act
      const result = await handler.execute(request, 10, 'USER_456');

      // Assert
      expect(adjustmentService.createAdjustment).toHaveBeenCalledWith(
        50,
        -50,
        'CORRECTION',
        'USER_456',
        undefined, // branchId undefined when not provided
        undefined,
      );
      expect(result.branchId).toBeNull();
    });

    it('should reject adjustment when customer does not belong to partner', async () => {
      // Arrange
      const request = new CreatePointsAdjustmentRequest();
      request.membershipId = 50;
      request.pointsDelta = 100;
      request.reasonCode = 'BONUS';
      request.branchId = 2;

      const wrongTenant = {
        id: 1,
        partnerId: 999, // Different partner
        name: 'Wrong Tenant',
      };

      membershipRepository.findById.mockResolvedValue(mockMembership);
      tenantRepository.findById.mockResolvedValue(wrongTenant);

      // Act & Assert
      await expect(handler.execute(request, 10, 'USER_123')).rejects.toThrow(ForbiddenException);
      expect(adjustmentService.createAdjustment).not.toHaveBeenCalled();
    });

    it('should handle null branchId explicitly', async () => {
      // Arrange
      const request = new CreatePointsAdjustmentRequest();
      request.membershipId = 50;
      request.pointsDelta = 75;
      request.reasonCode = 'BONUS';
      request.branchId = null; // Explicitly null

      const mockTransaction = new PointsTransaction(
        3,
        1,
        100,
        50,
        null,
        null,
        'ADJUSTMENT',
        75,
        'test-key-3',
        null,
        null,
        'USER_789',
        'BONUS',
        null,
        null,
        null,
        null,
        null, // branchId
        null, // amount ← NUEVO
        null, // currency ← NUEVO
        new Date(),
      );

      membershipRepository.findById.mockResolvedValue(mockMembership);
      tenantRepository.findById.mockResolvedValue(mockTenant);
      adjustmentService.createAdjustment.mockResolvedValue(mockTransaction);
      pointsTransactionRepository.calculateBalance.mockResolvedValue(575);

      // Act
      const result = await handler.execute(request, 10, 'USER_789');

      // Assert
      expect(adjustmentService.createAdjustment).toHaveBeenCalledWith(
        50,
        75,
        'BONUS',
        'USER_789',
        null, // branchId explicitly null
        undefined,
      );
      expect(result.branchId).toBeNull();
    });
  });
});
