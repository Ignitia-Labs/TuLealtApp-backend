import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantsController } from '../tenants.controller';
import {
  CreateTenantHandler,
  GetTenantHandler,
  GetTenantsByPartnerHandler,
  UpdateTenantHandler,
  DeleteTenantHandler,
  JwtPayload,
} from '@libs/application';
import { IUserRepository, ITenantRepository, User } from '@libs/domain';
import { PartnerLimitsEntity } from '@libs/infrastructure';

describe('TenantsController', () => {
  let controller: TenantsController;
  let createTenantHandler: jest.Mocked<CreateTenantHandler>;
  let getTenantHandler: jest.Mocked<GetTenantHandler>;
  let getTenantsByPartnerHandler: jest.Mocked<GetTenantsByPartnerHandler>;
  let updateTenantHandler: jest.Mocked<UpdateTenantHandler>;
  let deleteTenantHandler: jest.Mocked<DeleteTenantHandler>;
  let userRepository: jest.Mocked<IUserRepository>;
  let tenantRepository: jest.Mocked<ITenantRepository>;
  let partnerLimitsRepository: jest.Mocked<Repository<PartnerLimitsEntity>>;

  const mockUser: JwtPayload = {
    userId: 1,
    email: 'partner@test.com',
    roles: ['PARTNER'],
    context: 'partner',
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
    const mockCreateTenantHandler = {
      execute: jest.fn(),
    };

    const mockGetTenantHandler = {
      execute: jest.fn(),
    };

    const mockGetTenantsByPartnerHandler = {
      execute: jest.fn(),
    };

    const mockUpdateTenantHandler = {
      execute: jest.fn(),
    };

    const mockDeleteTenantHandler = {
      execute: jest.fn(),
    };

    const mockUserRepository = {
      findById: jest.fn(),
    };

    const mockTenantRepository = {
      findByPartnerId: jest.fn(),
      findById: jest.fn(),
    };

    const mockPartnerLimitsRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: CreateTenantHandler,
          useValue: mockCreateTenantHandler,
        },
        {
          provide: GetTenantHandler,
          useValue: mockGetTenantHandler,
        },
        {
          provide: GetTenantsByPartnerHandler,
          useValue: mockGetTenantsByPartnerHandler,
        },
        {
          provide: UpdateTenantHandler,
          useValue: mockUpdateTenantHandler,
        },
        {
          provide: DeleteTenantHandler,
          useValue: mockDeleteTenantHandler,
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
          provide: getRepositoryToken(PartnerLimitsEntity),
          useValue: mockPartnerLimitsRepository,
        },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
    createTenantHandler = module.get(CreateTenantHandler);
    getTenantHandler = module.get(GetTenantHandler);
    getTenantsByPartnerHandler = module.get(GetTenantsByPartnerHandler);
    updateTenantHandler = module.get(UpdateTenantHandler);
    deleteTenantHandler = module.get(DeleteTenantHandler);
    userRepository = module.get('IUserRepository');
    tenantRepository = module.get('ITenantRepository');
    partnerLimitsRepository = module.get(getRepositoryToken(PartnerLimitsEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTenants', () => {
    it('should return tenants for authenticated partner', async () => {
      const mockResponse = {
        tenants: [
          { id: 1, name: 'Tenant 1', partnerId: 1 },
          { id: 2, name: 'Tenant 2', partnerId: 1 },
        ],
      };

      userRepository.findById.mockResolvedValue(mockUserEntity);
      getTenantsByPartnerHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.getTenants(mockUser);

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.userId);
      expect(getTenantsByPartnerHandler.execute).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should throw ForbiddenException if user does not belong to a partner', async () => {
      const userWithoutPartner = User.create(
        'user@test.com',
        'User',
        'Test',
        'User',
        '+1234567890',
        'passwordHash',
        ['CUSTOMER'],
        null, // profile
        null, // partnerId
        null, // tenantId
        null, // branchId
        null, // avatar
        'active',
        1, // id
      );
      userRepository.findById.mockResolvedValue(userWithoutPartner);

      await expect(controller.getTenants(mockUser)).rejects.toThrow(ForbiddenException);
      await expect(controller.getTenants(mockUser)).rejects.toThrow(
        'User does not belong to a partner',
      );
    });
  });

  describe('createTenant', () => {
    const createRequest = {
      name: 'New Tenant',
      category: 'Retail',
      currencyId: 'currency-1',
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
    };

    it('should create tenant when limits are not exceeded', async () => {
      const mockResponse = {
        id: 1,
        partnerId: 1,
        name: 'New Tenant',
        category: 'Retail',
        status: 'active',
        createdAt: new Date(),
      };

      userRepository.findById.mockResolvedValue(mockUserEntity);
      partnerLimitsRepository.findOne.mockResolvedValue(mockPartnerLimitsEntity);
      tenantRepository.findByPartnerId.mockResolvedValue([]); // No existing tenants
      createTenantHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.createTenant(createRequest as any, mockUser);

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.userId);
      expect(partnerLimitsRepository.findOne).toHaveBeenCalledWith({
        where: { partnerId: 1 },
      });
      expect(tenantRepository.findByPartnerId).toHaveBeenCalledWith(1);
      expect(createTenantHandler.execute).toHaveBeenCalledWith({
        ...createRequest,
        partnerId: 1,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw BadRequestException when tenant limit is exceeded', async () => {
      const existingTenants = Array(5).fill({ id: 1, partnerId: 1 }); // 5 tenants (at limit)

      userRepository.findById.mockResolvedValue(mockUserEntity);
      partnerLimitsRepository.findOne.mockResolvedValue(mockPartnerLimitsEntity);
      tenantRepository.findByPartnerId.mockResolvedValue(existingTenants as any);

      await expect(controller.createTenant(createRequest as any, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.createTenant(createRequest as any, mockUser)).rejects.toThrow(
        'Maximum number of tenants reached',
      );
      expect(createTenantHandler.execute).not.toHaveBeenCalled();
    });

    it('should allow creation when maxTenants is 999 (unlimited)', async () => {
      const unlimitedLimits = {
        ...mockPartnerLimitsEntity,
        maxTenants: 999,
      };
      const existingTenants = Array(100).fill({ id: 1, partnerId: 1 }); // 100 tenants
      const mockResponse = {
        id: 1,
        partnerId: 1,
        name: 'New Tenant',
        category: 'Retail',
        status: 'active',
        createdAt: new Date(),
      };

      userRepository.findById.mockResolvedValue(mockUserEntity);
      partnerLimitsRepository.findOne.mockResolvedValue(unlimitedLimits);
      tenantRepository.findByPartnerId.mockResolvedValue(existingTenants as any);
      createTenantHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.createTenant(createRequest as any, mockUser);

      expect(createTenantHandler.execute).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException if limits not found', async () => {
      userRepository.findById.mockResolvedValue(mockUserEntity);
      partnerLimitsRepository.findOne.mockResolvedValue(null);

      await expect(controller.createTenant(createRequest as any, mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.createTenant(createRequest as any, mockUser)).rejects.toThrow(
        'Limits for partner',
      );
    });
  });

  describe('getTenant', () => {
    it('should return tenant by id', async () => {
      const mockResponse = {
        id: 1,
        name: 'Tenant 1',
        partnerId: 1,
      };

      getTenantHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.getTenant(1, mockUser);

      expect(getTenantHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 1 }),
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateTenant', () => {
    it('should update tenant', async () => {
      const updateRequest = {
        name: 'Updated Tenant',
      };
      const mockResponse = {
        id: 1,
        name: 'Updated Tenant',
        partnerId: 1,
      };

      updateTenantHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.updateTenant(1, updateRequest as any, mockUser);

      expect(updateTenantHandler.execute).toHaveBeenCalledWith(1, updateRequest);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant', async () => {
      const mockResponse = {
        tenantId: 1,
        message: 'Tenant deleted successfully',
      };

      deleteTenantHandler.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.deleteTenant(1, mockUser);

      expect(deleteTenantHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 1 }),
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
