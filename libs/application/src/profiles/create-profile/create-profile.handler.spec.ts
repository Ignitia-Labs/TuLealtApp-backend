import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CreateProfileHandler } from './create-profile.handler';
import { CreateProfileRequest } from './create-profile.request';
import { IProfileRepository, Profile } from '@libs/domain';
import { PermissionService } from '../../permissions/permission.service';

describe('CreateProfileHandler', () => {
  let handler: CreateProfileHandler;
  let profileRepository: jest.Mocked<IProfileRepository>;
  let permissionService: jest.Mocked<PermissionService>;

  beforeEach(async () => {
    const mockProfileRepository = {
      findById: jest.fn(),
      findByPartnerId: jest.fn(),
      findGlobalProfiles: jest.fn(),
      findByName: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUserId: jest.fn(),
    };

    const mockPermissionService = {
      validatePermissionFormat: jest.fn(),
      userHasPermission: jest.fn(),
      userCanAccess: jest.fn(),
      getUserPermissions: jest.fn(),
      parsePermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProfileHandler,
        {
          provide: 'IProfileRepository',
          useValue: mockProfileRepository,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    handler = module.get<CreateProfileHandler>(CreateProfileHandler);
    profileRepository = module.get('IProfileRepository');
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a profile successfully', async () => {
      const request = new CreateProfileRequest();
      request.name = 'Test Profile';
      request.description = 'Test description';
      request.permissions = ['admin.users.view', 'admin.users.create'];
      request.partnerId = null;
      request.isActive = true;

      const savedProfile = Profile.create(
        request.name,
        request.permissions,
        request.description,
        request.partnerId,
        request.isActive,
        1,
      );

      permissionService.validatePermissionFormat.mockReturnValue(true);
      profileRepository.findByName.mockResolvedValue(null);
      profileRepository.save.mockResolvedValue(savedProfile);

      const result = await handler.execute(request);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Profile');
      expect(result.permissions).toEqual(['admin.users.view', 'admin.users.create']);
      expect(permissionService.validatePermissionFormat).toHaveBeenCalledTimes(2);
      expect(profileRepository.findByName).toHaveBeenCalledWith('Test Profile', null);
      expect(profileRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid permission format', async () => {
      const request = new CreateProfileRequest();
      request.name = 'Test Profile';
      request.permissions = ['invalid.permission'];

      permissionService.validatePermissionFormat.mockReturnValue(false);

      await expect(handler.execute(request)).rejects.toThrow(BadRequestException);
      expect(permissionService.validatePermissionFormat).toHaveBeenCalledWith('invalid.permission');
      expect(profileRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when profile with same name exists', async () => {
      const request = new CreateProfileRequest();
      request.name = 'Test Profile';
      request.permissions = ['admin.users.view'];
      request.partnerId = null;

      const existingProfile = Profile.create('Test Profile', ['admin.products.view']);

      permissionService.validatePermissionFormat.mockReturnValue(true);
      profileRepository.findByName.mockResolvedValue(existingProfile);

      await expect(handler.execute(request)).rejects.toThrow(ConflictException);
      expect(profileRepository.save).not.toHaveBeenCalled();
    });

    it('should create partner-specific profile', async () => {
      const request = new CreateProfileRequest();
      request.name = 'Partner Profile';
      request.permissions = ['partner.products.view'];
      request.partnerId = 1;

      const savedProfile = Profile.create(
        request.name,
        request.permissions,
        null,
        request.partnerId,
        true,
        1,
      );

      permissionService.validatePermissionFormat.mockReturnValue(true);
      profileRepository.findByName.mockResolvedValue(null);
      profileRepository.save.mockResolvedValue(savedProfile);

      const result = await handler.execute(request);

      expect(result.partnerId).toBe(1);
      expect(profileRepository.findByName).toHaveBeenCalledWith('Partner Profile', 1);
    });

    it('should validate all permissions', async () => {
      const request = new CreateProfileRequest();
      request.name = 'Test Profile';
      request.permissions = [
        'admin.users.view',
        'admin.users.create',
        'admin.products.view',
      ];

      permissionService.validatePermissionFormat.mockReturnValue(true);
      profileRepository.findByName.mockResolvedValue(null);
      profileRepository.save.mockResolvedValue(
        Profile.create(request.name, request.permissions, null, null, true, 1),
      );

      await handler.execute(request);

      expect(permissionService.validatePermissionFormat).toHaveBeenCalledTimes(3);
      expect(permissionService.validatePermissionFormat).toHaveBeenCalledWith('admin.users.view');
      expect(permissionService.validatePermissionFormat).toHaveBeenCalledWith('admin.users.create');
      expect(permissionService.validatePermissionFormat).toHaveBeenCalledWith('admin.products.view');
    });
  });
});

