import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CreatePermissionHandler } from './create-permission.handler';
import { CreatePermissionRequest } from './create-permission.request';
import { IPermissionRepository, Permission } from '@libs/domain';
import { PermissionService } from '../permission.service';

describe('CreatePermissionHandler', () => {
  let handler: CreatePermissionHandler;
  let permissionRepository: jest.Mocked<IPermissionRepository>;
  let permissionService: jest.Mocked<PermissionService>;

  beforeEach(async () => {
    const mockPermissionRepository = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      findByModule: jest.fn(),
      findByModuleAndResource: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      validatePermissions: jest.fn(),
      findActive: jest.fn(),
      count: jest.fn(),
      countByModule: jest.fn(),
    };

    const mockPermissionService = {
      validatePermissionFormat: jest.fn(),
      userHasPermission: jest.fn(),
      userCanAccess: jest.fn(),
      getUserPermissions: jest.fn(),
      parsePermission: jest.fn(),
      validatePermissionsExist: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePermissionHandler,
        {
          provide: 'IPermissionRepository',
          useValue: mockPermissionRepository,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    handler = module.get<CreatePermissionHandler>(CreatePermissionHandler);
    permissionRepository = module.get('IPermissionRepository');
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a permission successfully', async () => {
      const request = new CreatePermissionRequest();
      request.code = 'admin.users.create';
      request.module = 'admin';
      request.resource = 'users';
      request.action = 'create';
      request.description = 'Create users';
      request.isActive = true;

      const savedPermission = Permission.create(
        request.code,
        request.module,
        request.resource,
        request.action,
        request.description,
        request.isActive,
        1,
      );

      permissionService.validatePermissionFormat.mockReturnValue(true);
      permissionRepository.findByCode.mockResolvedValue(null);
      permissionRepository.save.mockResolvedValue(savedPermission);

      const result = await handler.execute(request);

      expect(result.id).toBe(1);
      expect(result.code).toBe('admin.users.create');
      expect(result.module).toBe('admin');
      expect(result.resource).toBe('users');
      expect(result.action).toBe('create');
      expect(result.description).toBe('Create users');
      expect(permissionService.validatePermissionFormat).toHaveBeenCalledWith('admin.users.create');
      expect(permissionRepository.findByCode).toHaveBeenCalledWith('admin.users.create');
      expect(permissionRepository.save).toHaveBeenCalled();
    });

    it('should create a wildcard permission successfully', async () => {
      const request = new CreatePermissionRequest();
      request.code = 'admin.*';
      request.module = 'admin';
      request.resource = '*';
      request.action = '*';
      request.description = 'Full admin access';
      request.isActive = true;

      const savedPermission = Permission.create(
        request.code,
        request.module,
        request.resource,
        request.action,
        request.description,
        request.isActive,
        1,
      );

      permissionService.validatePermissionFormat.mockReturnValue(true);
      permissionRepository.findByCode.mockResolvedValue(null);
      permissionRepository.save.mockResolvedValue(savedPermission);

      const result = await handler.execute(request);

      expect(result.code).toBe('admin.*');
      expect(result.action).toBe('*');
    });

    it('should throw BadRequestException if code does not match format', async () => {
      const request = new CreatePermissionRequest();
      request.code = 'admin.users.create';
      request.module = 'admin';
      request.resource = 'users';
      request.action = 'view'; // Different action

      permissionService.validatePermissionFormat.mockReturnValue(true);

      await expect(handler.execute(request)).rejects.toThrow(BadRequestException);
      expect(permissionRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid permission format', async () => {
      const request = new CreatePermissionRequest();
      request.code = 'invalid.permission';
      request.module = 'admin';
      request.resource = 'users';
      request.action = 'create';

      permissionService.validatePermissionFormat.mockReturnValue(false);

      await expect(handler.execute(request)).rejects.toThrow(BadRequestException);
      expect(permissionService.validatePermissionFormat).toHaveBeenCalledWith('invalid.permission');
      expect(permissionRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when permission with same code exists', async () => {
      const request = new CreatePermissionRequest();
      request.code = 'admin.users.create';
      request.module = 'admin';
      request.resource = 'users';
      request.action = 'create';

      const existingPermission = Permission.create(
        'admin.users.create',
        'admin',
        'users',
        'create',
      );

      permissionService.validatePermissionFormat.mockReturnValue(true);
      permissionRepository.findByCode.mockResolvedValue(existingPermission);

      await expect(handler.execute(request)).rejects.toThrow(ConflictException);
      expect(permissionRepository.save).not.toHaveBeenCalled();
    });

    it('should create permission with null description', async () => {
      const request = new CreatePermissionRequest();
      request.code = 'admin.users.view';
      request.module = 'admin';
      request.resource = 'users';
      request.action = 'view';
      request.description = null;
      request.isActive = true;

      const savedPermission = Permission.create(
        request.code,
        request.module,
        request.resource,
        request.action,
        null,
        true,
        1,
      );

      permissionService.validatePermissionFormat.mockReturnValue(true);
      permissionRepository.findByCode.mockResolvedValue(null);
      permissionRepository.save.mockResolvedValue(savedPermission);

      const result = await handler.execute(request);

      expect(result.description).toBeNull();
    });
  });
});

