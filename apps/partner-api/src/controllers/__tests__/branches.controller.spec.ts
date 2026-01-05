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
import { PartnerLimitsEntity } from '@libs/infrastructure';

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
  let partnerLimitsRepository: jest.Mocked<Repository<PartnerLimitsEntity>>;

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

  const mockPartnerLimitsEntity: PartnerLimitsEntity = {
    id: 1,
    partnerId: 1,
    maxTenants: 5,
    maxBranches: 20,
    maxCustomers: 5000,
    maxRewards: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as PartnerLimitsEntity;

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

    const mockPartnerLimitsRepository = {
      findOne: jest.fn(),
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
          provide: getRepositoryToken(PartnerLimitsEntity),
          useValue: mockPartnerLimitsRepository,
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
    partnerLimitsRepository = module.get(getRepositoryToken(PartnerLimitsEntity));
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
      partnerLimitsRepository.findOne.mockResolvedValue(mockPartnerLimitsEntity);
      tenantRepository.findByPartnerId.mockResolvedValue([mockTenant] as any);
      branchRepository.findByTenantId.mockResolvedValue([]); // No existing branches
      createBranchHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.createBranch(1, createRequest as any, mockUser);

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.userId);
      expect(tenantRepository.findById).toHaveBeenCalledWith(1);
      expect(partnerLimitsRepository.findOne).toHaveBeenCalledWith({
        where: { partnerId: 1 },
      });
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
      partnerLimitsRepository.findOne.mockResolvedValue(mockPartnerLimitsEntity);
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
      partnerLimitsRepository.findOne.mockResolvedValue({
        ...mockPartnerLimitsEntity,
        maxBranches: 25, // Allow more
      });
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

    it('should allow creation when maxBranches is 999 (unlimited)', async () => {
      const unlimitedLimits = {
        ...mockPartnerLimitsEntity,
        maxBranches: 999,
      };
      const existingBranches = Array(100).fill({ id: 1, tenantId: 1 }); // 100 branches
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
      partnerLimitsRepository.findOne.mockResolvedValue(unlimitedLimits);
      tenantRepository.findByPartnerId.mockResolvedValue([mockTenant] as any);
      branchRepository.findByTenantId.mockResolvedValue(existingBranches as any);
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

      userRepository.findById.mockResolvedValue(mockAdminUserEntity);
      tenantRepository.findById.mockResolvedValue(otherTenant as any);
      partnerLimitsRepository.findOne.mockResolvedValue({
        ...mockPartnerLimitsEntity,
        partnerId: 2,
      });
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
