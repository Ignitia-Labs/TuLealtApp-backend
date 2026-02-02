import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchesController } from '../branches.controller';
import {
  CreateBranchHandler,
  GetBranchHandler,
  GetBranchesByTenantHandler,
  UpdateBranchHandler,
  DeleteBranchHandler,
  JwtPayload,
} from '@libs/application';
import { IUserRepository, ITenantRepository, IBranchRepository, User } from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerSubscriptionUsageEntity } from '@libs/infrastructure';
import { IPricingPlanRepository } from '@libs/domain';

describe('BranchesController', () => {
  let controller: BranchesController;
  let createBranchHandler: jest.Mocked<CreateBranchHandler>;
  let getBranchHandler: jest.Mocked<GetBranchHandler>;
  let getBranchesByTenantHandler: jest.Mocked<GetBranchesByTenantHandler>;
  let updateBranchHandler: jest.Mocked<UpdateBranchHandler>;
  let deleteBranchHandler: jest.Mocked<DeleteBranchHandler>;
  let userRepository: jest.Mocked<IUserRepository>;
  let tenantRepository: jest.Mocked<ITenantRepository>;
  let branchRepository: jest.Mocked<IBranchRepository>;
  let subscriptionRepository: jest.Mocked<Repository<PartnerSubscriptionEntity>>;
  let usageRepository: jest.Mocked<Repository<PartnerSubscriptionUsageEntity>>;
  let pricingPlanRepository: jest.Mocked<IPricingPlanRepository>;

  const mockUser: JwtPayload = {
    userId: 1,
    email: 'partner@test.com',
    roles: ['PARTNER'],
    context: 'partner',
  };

  const mockAdminUser: JwtPayload = {
    userId: 2,
    email: 'admin@test.com',
    roles: ['ADMIN'],
    context: 'admin',
  };

  const mockUserEntity = User.create(
    'partner@test.com',
    'Partner User',
    'Partner',
    'User',
    '+1234567890',
    'passwordHash',
    ['PARTNER'],
    null, // profile
    1, // partnerId
    null, // tenantId
    null, // branchId
    null, // avatar
    'active',
    1, // id
  );

  const mockTenant = {
    id: 1,
    partnerId: 1,
    name: 'Test Tenant',
  };

  const mockSubscriptionEntity: PartnerSubscriptionEntity = {
    id: 1,
    partnerId: 1,
    planId: 1,
    planType: 'conecta',
    status: 'active',
    billingFrequency: 'monthly',
    billingAmount: 100,
    usage: {
      id: 1,
      partnerSubscriptionId: 1,
      tenantsCount: 2,
      branchesCount: 5,
      customersCount: 100,
      rewardsCount: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PartnerSubscriptionUsageEntity,
  } as PartnerSubscriptionEntity;

  const mockPricingPlanLimits = {
    id: 1,
    pricingPlanId: 1,
    maxTenants: 5,
    maxBranches: 20,
    maxCustomers: 5000,
    maxRewards: 50,
    maxAdmins: -1,
    storageGB: -1,
    apiCallsPerMonth: -1,
    maxLoyaltyPrograms: -1,
    maxLoyaltyProgramsBase: -1,
    maxLoyaltyProgramsPromo: -1,
    maxLoyaltyProgramsPartner: -1,
    maxLoyaltyProgramsSubscription: -1,
    maxLoyaltyProgramsExperimental: -1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockCreateBranchHandler = {
      execute: jest.fn(),
    };

    const mockGetBranchHandler = {
      execute: jest.fn(),
    };

    const mockGetBranchesByTenantHandler = {
      execute: jest.fn(),
    };

    const mockUpdateBranchHandler = {
      execute: jest.fn(),
    };

    const mockDeleteBranchHandler = {
      execute: jest.fn(),
    };

    const mockUserRepository = {
      findById: jest.fn(),
    };

    const mockTenantRepository = {
      findById: jest.fn(),
      findByPartnerId: jest.fn(),
    };

    const mockBranchRepository = {
      findByTenantId: jest.fn(),
    };

    const mockSubscriptionRepository = {
      findOne: jest.fn(),
    };

    const mockUsageRepository = {
      findOne: jest.fn(),
    };

    const mockPricingPlanRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [
        {
          provide: CreateBranchHandler,
          useValue: mockCreateBranchHandler,
        },
        {
          provide: GetBranchHandler,
          useValue: mockGetBranchHandler,
        },
        {
          provide: GetBranchesByTenantHandler,
          useValue: mockGetBranchesByTenantHandler,
        },
        {
          provide: UpdateBranchHandler,
          useValue: mockUpdateBranchHandler,
        },
        {
          provide: DeleteBranchHandler,
          useValue: mockDeleteBranchHandler,
        },
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
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
          provide: 'IPricingPlanRepository',
          useValue: mockPricingPlanRepository,
        },
        {
          provide: getRepositoryToken(PartnerSubscriptionEntity),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(PartnerSubscriptionUsageEntity),
          useValue: mockUsageRepository,
        },
      ],
    }).compile();

    controller = module.get<BranchesController>(BranchesController);
    createBranchHandler = module.get(CreateBranchHandler);
    getBranchHandler = module.get(GetBranchHandler);
    getBranchesByTenantHandler = module.get(GetBranchesByTenantHandler);
    updateBranchHandler = module.get(UpdateBranchHandler);
    deleteBranchHandler = module.get(DeleteBranchHandler);
    userRepository = module.get('IUserRepository');
    tenantRepository = module.get('ITenantRepository');
    branchRepository = module.get('IBranchRepository');
    pricingPlanRepository = module.get('IPricingPlanRepository');
    subscriptionRepository = module.get(getRepositoryToken(PartnerSubscriptionEntity));
    usageRepository = module.get(getRepositoryToken(PartnerSubscriptionUsageEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBranchesByTenant', () => {
    it('should return branches for tenant belonging to user partner', async () => {
      const mockResponse = {
        branches: [
          { id: 1, name: 'Branch 1', tenantId: 1 },
          { id: 2, name: 'Branch 2', tenantId: 1 },
        ],
      };

      tenantRepository.findById.mockResolvedValue(mockTenant as any);
      userRepository.findById.mockResolvedValue(mockUserEntity);
      getBranchesByTenantHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.getBranchesByTenant(1, mockUser);

      expect(tenantRepository.findById).toHaveBeenCalledWith(1);
      expect(getBranchesByTenantHandler.execute).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should throw ForbiddenException if tenant does not belong to user partner', async () => {
      const otherTenant = {
        id: 2,
        partnerId: 2, // Different partner
      };

      tenantRepository.findById.mockResolvedValue(otherTenant as any);
      userRepository.findById.mockResolvedValue(mockUserEntity);

      await expect(controller.getBranchesByTenant(2, mockUser)).rejects.toThrow(ForbiddenException);
      await expect(controller.getBranchesByTenant(2, mockUser)).rejects.toThrow(
        'You can only access branches from tenants of your partner',
      );
    });

    it('should allow access for ADMIN user', async () => {
      const mockResponse = {
        branches: [{ id: 1, name: 'Branch 1', tenantId: 1 }],
      };

      tenantRepository.findById.mockResolvedValue(mockTenant as any);
      getBranchesByTenantHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.getBranchesByTenant(1, mockAdminUser);

      expect(result).toEqual(mockResponse);
      // Should not check ownership for ADMIN
    });
  });

  describe('createBranch', () => {
    const createRequest = {
      name: 'New Branch',
      address: '123 Main St',
      city: 'City',
      country: 'Country',
    };

    it('should create branch when limits are not exceeded', async () => {
      const mockResponse = {
        id: 1,
        tenantId: 1,
        name: 'New Branch',
        address: '123 Main St',
        status: 'active',
        createdAt: new Date(),
      };

      userRepository.findById.mockResolvedValue(mockUserEntity);
      tenantRepository.findById.mockResolvedValue(mockTenant as any);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscriptionEntity);
      pricingPlanRepository.findById.mockResolvedValue({
        id: 1,
        limits: mockPricingPlanLimits,
      } as any);
      usageRepository.findOne.mockResolvedValue(mockSubscriptionEntity.usage);
      tenantRepository.findByPartnerId.mockResolvedValue([mockTenant] as any);
      branchRepository.findByTenantId.mockResolvedValue([]); // No existing branches
      createBranchHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.createBranch(1, createRequest as any, mockUser);

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.userId);
      expect(tenantRepository.findById).toHaveBeenCalledWith(1);
      expect(subscriptionRepository.findOne).toHaveBeenCalled();
      expect(pricingPlanRepository.findById).toHaveBeenCalled();
      expect(createBranchHandler.execute).toHaveBeenCalledWith({
        ...createRequest,
        tenantId: 1,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw BadRequestException when branch limit is exceeded', async () => {
      const existingBranches = Array(20).fill({ id: 1, tenantId: 1 }); // 20 branches (at limit)

      userRepository.findById.mockResolvedValue(mockUserEntity);
      tenantRepository.findById.mockResolvedValue(mockTenant as any);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscriptionEntity);
      pricingPlanRepository.findById.mockResolvedValue({
        id: 1,
        limits: mockPricingPlanLimits,
      } as any);
      usageRepository.findOne.mockResolvedValue(mockSubscriptionEntity.usage);
      tenantRepository.findByPartnerId.mockResolvedValue([mockTenant] as any);
      branchRepository.findByTenantId.mockResolvedValue(existingBranches as any);

      await expect(controller.createBranch(1, createRequest as any, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.createBranch(1, createRequest as any, mockUser)).rejects.toThrow(
        'Maximum number of branches reached',
      );
      expect(createBranchHandler.execute).not.toHaveBeenCalled();
    });

    it('should count branches from all tenants of the partner', async () => {
      const tenant1 = { id: 1, partnerId: 1 };
      const tenant2 = { id: 2, partnerId: 1 };
      const branchesTenant1 = Array(10).fill({ id: 1, tenantId: 1 });
      const branchesTenant2 = Array(10).fill({ id: 1, tenantId: 2 });
      const mockResponse = {
        id: 1,
        tenantId: 1,
        name: 'New Branch',
        address: '123 Main St',
        status: 'active',
        createdAt: new Date(),
      };

      userRepository.findById.mockResolvedValue(mockUserEntity);
      tenantRepository.findById.mockResolvedValue(tenant1 as any);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscriptionEntity);
      pricingPlanRepository.findById.mockResolvedValue({
        id: 1,
        limits: {
          ...mockPricingPlanLimits,
          maxBranches: 25, // Allow more
        },
      } as any);
      tenantRepository.findByPartnerId.mockResolvedValue([tenant1, tenant2] as any);
      branchRepository.findByTenantId
        .mockResolvedValueOnce(branchesTenant1 as any)
        .mockResolvedValueOnce(branchesTenant2 as any);
      createBranchHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.createBranch(1, createRequest as any, mockUser);

      // Should count branches from both tenants (20 total)
      expect(branchRepository.findByTenantId).toHaveBeenCalledTimes(2);
      expect(createBranchHandler.execute).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should allow creation when maxBranches is -1 (unlimited)', async () => {
      const unlimitedLimits = {
        ...mockPricingPlanLimits,
        maxBranches: -1, // Unlimited
      };
      const usageWithManyBranches = {
        ...mockSubscriptionEntity.usage,
        branchesCount: 100, // Many branches but unlimited
      } as PartnerSubscriptionUsageEntity;
      const mockResponse = {
        id: 1,
        tenantId: 1,
        name: 'New Branch',
        address: '123 Main St',
        status: 'active',
        createdAt: new Date(),
      };

      userRepository.findById.mockResolvedValue(mockUserEntity);
      tenantRepository.findById.mockResolvedValue(mockTenant as any);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscriptionEntity);
      pricingPlanRepository.findById.mockResolvedValue({
        id: 1,
        limits: unlimitedLimits,
      } as any);
      usageRepository.findOne.mockResolvedValue(usageWithManyBranches);
      createBranchHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.createBranch(1, createRequest as any, mockUser);

      expect(createBranchHandler.execute).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should throw ForbiddenException if tenant does not belong to user partner', async () => {
      const otherTenant = {
        id: 2,
        partnerId: 2,
      };

      userRepository.findById.mockResolvedValue(mockUserEntity);
      tenantRepository.findById.mockResolvedValue(otherTenant as any);

      await expect(controller.createBranch(2, createRequest as any, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.createBranch(2, createRequest as any, mockUser)).rejects.toThrow(
        'You can only create branches for tenants from your partner',
      );
    });

    it('should allow ADMIN to create branch for any tenant', async () => {
      const otherTenant = {
        id: 2,
        partnerId: 2,
      };
      const mockAdminUserEntity = User.create(
        'admin@test.com',
        'Admin User',
        'Admin',
        'User',
        '+1234567890',
        'passwordHash',
        ['ADMIN'],
        null, // profile
        null, // partnerId (ADMIN puede no tener partner)
        null, // tenantId
        null, // branchId
        null, // avatar
        'active',
        2, // id
      );
      const mockResponse = {
        id: 1,
        tenantId: 2,
        name: 'New Branch',
        address: '123 Main St',
        status: 'active',
        createdAt: new Date(),
      };

      const otherPartnerSubscription = {
        ...mockSubscriptionEntity,
        partnerId: 2,
      } as PartnerSubscriptionEntity;

      userRepository.findById.mockResolvedValue(mockAdminUserEntity);
      tenantRepository.findById.mockResolvedValue(otherTenant as any);
      subscriptionRepository.findOne.mockResolvedValue(otherPartnerSubscription);
      pricingPlanRepository.findById.mockResolvedValue({
        id: 1,
        limits: mockPricingPlanLimits,
      } as any);
      usageRepository.findOne.mockResolvedValue(mockSubscriptionEntity.usage);
      tenantRepository.findByPartnerId.mockResolvedValue([otherTenant] as any);
      branchRepository.findByTenantId.mockResolvedValue([]);
      createBranchHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.createBranch(2, createRequest as any, mockAdminUser);

      expect(createBranchHandler.execute).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getBranch', () => {
    it('should return branch by id', async () => {
      const mockResponse = {
        id: 1,
        name: 'Branch 1',
        tenantId: 1,
      };

      getBranchHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.getBranch(1, mockUser);

      expect(getBranchHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 1 }),
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateBranch', () => {
    it('should update branch', async () => {
      const updateRequest = {
        name: 'Updated Branch',
      };
      const mockResponse = {
        id: 1,
        name: 'Updated Branch',
        tenantId: 1,
      };

      updateBranchHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.updateBranch(1, updateRequest as any, mockUser);

      expect(updateBranchHandler.execute).toHaveBeenCalledWith(1, updateRequest);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch', async () => {
      const mockResponse = {
        branchId: 1,
        message: 'Branch deleted successfully',
      };

      deleteBranchHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.deleteBranch(1, mockUser);

      expect(deleteBranchHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 1 }),
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
