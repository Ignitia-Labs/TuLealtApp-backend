import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PartnerResourceGuard } from '../partner-resource.guard';
import { JwtPayload } from '@libs/application';

describe('PartnerResourceGuard', () => {
  let guard: PartnerResourceGuard;
  let mockUserRepository: any;
  let mockTenantRepository: any;
  let mockBranchRepository: any;

  const createMockExecutionContext = (
    user: JwtPayload | null,
    params: any = {},
    path: string = '',
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          path,
        }),
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    mockUserRepository = {
      findById: jest.fn(),
    };

    mockTenantRepository = {
      findById: jest.fn(),
    };

    mockBranchRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnerResourceGuard,
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
      ],
    }).compile();

    guard = module.get<PartnerResourceGuard>(PartnerResourceGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access if user is not authenticated (let other guards handle)', async () => {
      const context = createMockExecutionContext(null);
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access if user is not PARTNER or PARTNER_STAFF', async () => {
      const user: JwtPayload = {
        userId: 1,
        email: 'admin@test.com',
        roles: ['ADMIN'],
        context: 'admin',
      };
      const context = createMockExecutionContext(user);
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user not found', async () => {
      const user: JwtPayload = {
        userId: 1,
        email: 'partner@test.com',
        roles: ['PARTNER'],
        context: 'partner',
      };
      mockUserRepository.findById.mockResolvedValue(null);

      const context = createMockExecutionContext(user);
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('User not found');
    });

    it('should throw ForbiddenException if user does not belong to a partner', async () => {
      const user: JwtPayload = {
        userId: 1,
        email: 'partner@test.com',
        roles: ['PARTNER'],
        context: 'partner',
      };
      mockUserRepository.findById.mockResolvedValue({ partnerId: null });

      const context = createMockExecutionContext(user);
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('User does not belong to a partner');
    });

    describe('Tenant validation', () => {
      it('should allow access if tenant belongs to user partner', async () => {
        const user: JwtPayload = {
          userId: 1,
          email: 'partner@test.com',
          roles: ['PARTNER'],
          context: 'partner',
        };
        mockUserRepository.findById.mockResolvedValue({ partnerId: 1 });
        mockTenantRepository.findById.mockResolvedValue({ partnerId: 1 });

        const context = createMockExecutionContext(user, { id: '1' }, '/partner/tenants/1');
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should throw ForbiddenException if tenant does not belong to user partner', async () => {
        const user: JwtPayload = {
          userId: 1,
          email: 'partner@test.com',
          roles: ['PARTNER'],
          context: 'partner',
        };
        mockUserRepository.findById.mockResolvedValue({ partnerId: 1 });
        mockTenantRepository.findById.mockResolvedValue({ partnerId: 2 });

        const context = createMockExecutionContext(user, { id: '1' }, '/partner/tenants/1');
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow(
          'You can only access tenants from your partner',
        );
      });

      it('should allow access if tenant not found (let handler handle 404)', async () => {
        const user: JwtPayload = {
          userId: 1,
          email: 'partner@test.com',
          roles: ['PARTNER'],
          context: 'partner',
        };
        mockUserRepository.findById.mockResolvedValue({ partnerId: 1 });
        mockTenantRepository.findById.mockResolvedValue(null);

        const context = createMockExecutionContext(user, { id: '1' }, '/partner/tenants/1');
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should validate tenant from tenantId param', async () => {
        const user: JwtPayload = {
          userId: 1,
          email: 'partner@test.com',
          roles: ['PARTNER'],
          context: 'partner',
        };
        mockUserRepository.findById.mockResolvedValue({ partnerId: 1 });
        mockTenantRepository.findById.mockResolvedValue({ partnerId: 1 });

        const context = createMockExecutionContext(
          user,
          { tenantId: '2' },
          '/partner/tenants/2/branches',
        );
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
        expect(mockTenantRepository.findById).toHaveBeenCalledWith(2);
      });
    });

    describe('Branch validation', () => {
      it('should allow access if branch belongs to tenant of user partner', async () => {
        const user: JwtPayload = {
          userId: 1,
          email: 'partner@test.com',
          roles: ['PARTNER'],
          context: 'partner',
        };
        mockUserRepository.findById.mockResolvedValue({ partnerId: 1 });
        mockBranchRepository.findById.mockResolvedValue({ tenantId: 1 });
        mockTenantRepository.findById.mockResolvedValue({ partnerId: 1 });

        const context = createMockExecutionContext(user, { id: '1' }, '/partner/branches/1');
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should throw ForbiddenException if branch tenant does not belong to user partner', async () => {
        const user: JwtPayload = {
          userId: 1,
          email: 'partner@test.com',
          roles: ['PARTNER'],
          context: 'partner',
        };
        mockUserRepository.findById.mockResolvedValue({ partnerId: 1 });
        mockBranchRepository.findById.mockResolvedValue({ tenantId: 1 });
        mockTenantRepository.findById.mockResolvedValue({ partnerId: 2 });

        const context = createMockExecutionContext(user, { id: '1' }, '/partner/branches/1');
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow(
          'You can only access branches from your partner',
        );
      });

      it('should allow access if branch not found (let handler handle 404)', async () => {
        const user: JwtPayload = {
          userId: 1,
          email: 'partner@test.com',
          roles: ['PARTNER'],
          context: 'partner',
        };
        mockUserRepository.findById.mockResolvedValue({ partnerId: 1 });
        mockBranchRepository.findById.mockResolvedValue(null);

        const context = createMockExecutionContext(user, { id: '1' }, '/partner/branches/1');
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should allow access if tenant of branch not found (let handler handle 404)', async () => {
        const user: JwtPayload = {
          userId: 1,
          email: 'partner@test.com',
          roles: ['PARTNER'],
          context: 'partner',
        };
        mockUserRepository.findById.mockResolvedValue({ partnerId: 1 });
        mockBranchRepository.findById.mockResolvedValue({ tenantId: 1 });
        mockTenantRepository.findById.mockResolvedValue(null);

        const context = createMockExecutionContext(user, { id: '1' }, '/partner/branches/1');
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });
    });

    describe('PARTNER_STAFF validation', () => {
      it('should validate tenant ownership for PARTNER_STAFF', async () => {
        const user: JwtPayload = {
          userId: 2,
          email: 'staff@test.com',
          roles: ['PARTNER_STAFF'],
          context: 'partner',
        };
        mockUserRepository.findById.mockResolvedValue({ partnerId: 1 });
        mockTenantRepository.findById.mockResolvedValue({ partnerId: 1 });

        const context = createMockExecutionContext(user, { id: '1' }, '/partner/tenants/1');
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should throw ForbiddenException for PARTNER_STAFF accessing other partner tenant', async () => {
        const user: JwtPayload = {
          userId: 2,
          email: 'staff@test.com',
          roles: ['PARTNER_STAFF'],
          context: 'partner',
        };
        mockUserRepository.findById.mockResolvedValue({ partnerId: 1 });
        mockTenantRepository.findById.mockResolvedValue({ partnerId: 2 });

        const context = createMockExecutionContext(user, { id: '1' }, '/partner/tenants/1');
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      });
    });
  });
});
